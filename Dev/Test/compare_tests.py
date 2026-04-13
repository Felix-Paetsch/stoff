from __future__ import annotations

from termcolor import colored
import json
import os
from typing import Any, TypedDict

from python.image_similarity import image_similarity, print_failing_similarity_reports

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


JsonValue = Any
Asset = tuple[str, JsonValue | str]


class NoReferenceReason(TypedDict):
    type: str


class WrongArtifactAmountReason(TypedDict):
    type: str


class NoMatchingJsonReason(TypedDict):
    type: str
    out: list[JsonValue]
    reference: list[JsonValue]


class NoMatchingImgReason(TypedDict):
    type: str
    out: list[str]
    reference: list[str]

class BuildErrorReason(TypedDict):
    type: str
    error: str


FailureReason = (
    NoReferenceReason
    | WrongArtifactAmountReason
    | NoMatchingJsonReason
    | NoMatchingImgReason
    | BuildErrorReason
)


class SuccessTestResult(TypedDict):
    test: str
    success: bool


class FailureTestResult(TypedDict):
    test: str
    success: bool
    reason: FailureReason


TestResult = SuccessTestResult | FailureTestResult


class TestDictionary(TypedDict):
    test: str
    output_assets: list[Asset] | None
    reference_assets: list[Asset] | None


def list_directories(path: str) -> list[str]:
    full_path = os.path.join(BASE_DIR, path)
    directories = [
        d for d in os.listdir(full_path) if os.path.isdir(os.path.join(full_path, d))
    ]
    return sorted(directories)


def get_assets_from_directory(path: str) -> list[Asset] | None:
    full_path = os.path.join(BASE_DIR, path)

    if not os.path.isdir(full_path):
        return None

    assets: list[Asset] = []

    for filename in sorted(os.listdir(full_path)):
        file_path = os.path.join(full_path, filename)

        if not os.path.isfile(file_path):
            continue

        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        if ext == ".json":
            with open(file_path, "r", encoding="utf-8") as f:
                contents = json.load(f)
            assets.append(("json", contents))

        elif ext in {".png", ".jpg", ".webp", ".jpeg"}:
            assets.append(("img", file_path))

    return assets


def create_test_dictionary(test: str) -> TestDictionary:
    return {
        "test": test,
        "output_assets": get_assets_from_directory(f"test_output/{test}"),
        "reference_assets": get_assets_from_directory(f"reference_output/{test}"),
    }


def deep_equal_json(a: JsonValue, b: JsonValue) -> bool:
    """
    Deep equality for JSON-like values.

    Objects are compared independent of key order.
    Arrays must match in order.
    Strings/numbers/bools/null must match exactly.
    """
    if type(a) is not type(b):
        return False

    if isinstance(a, dict):
        if set(a.keys()) != set(b.keys()):
            return False
        return all(deep_equal_json(a[key], b[key]) for key in a)

    if isinstance(a, list):
        if len(a) != len(b):
            return False
        return all(deep_equal_json(x, y) for x, y in zip(a, b))

    return a == b


def has_perfect_matching(
    adjacency: list[list[int]], right_size: int
) -> bool:
    """
    Returns True iff every node on the left can be matched to a distinct node
    on the right according to adjacency.

    Standard DFS-based bipartite matching.
    """
    match_to_left = [-1] * right_size

    def try_kunh(left: int, seen: list[bool]) -> bool:
        for right in adjacency[left]:
            if seen[right]:
                continue
            seen[right] = True

            if match_to_left[right] == -1 or try_kunh(match_to_left[right], seen):
                match_to_left[right] = left
                return True

        return False

    for left in range(len(adjacency)):
        seen = [False] * right_size
        if not try_kunh(left, seen):
            return False

    return True


def compare_json_arrays(a: list[JsonValue], b: list[JsonValue]) -> bool:
    """
    Returns True iff there exists a bijection between a and b such that matched
    entries are deeply equal JSON values.

    This correctly handles duplicates.
    """
    if len(a) != len(b):
        return False

    adjacency: list[list[int]] = []
    for item_a in a:
        matches = []
        for j, item_b in enumerate(b):
            if deep_equal_json(item_a, item_b):
                matches.append(j)
        adjacency.append(matches)

    return has_perfect_matching(adjacency, len(b))


def all_images_are_similar(
    output_images: list[str], reference_images: list[str]
) -> bool:
    """
    Returns True iff there exists a bijection between output_images and
    reference_images such that every matched pair satisfies image_similarity().

    This correctly handles the case where similarity is not transitive.
    """
    if len(output_images) != len(reference_images):
        return False

    adjacency: list[list[int]] = []
    for output_image in output_images:
        matches = []
        for j, reference_image in enumerate(reference_images):
            if image_similarity(output_image, reference_image):
                matches.append(j)
        adjacency.append(matches)

    return has_perfect_matching(adjacency, len(reference_images))


def perform_test(test_dict: TestDictionary) -> TestResult:
    if test_dict["output_assets"] is None:
        raise Exception("Output folder not found anymore?!")

    if test_dict["reference_assets"] is None:
        return {
            "test": test_dict["test"],
            "success": False,
            "reason": {
                "type": "NoReference",
            },
        }

    output_assets = test_dict["output_assets"]
    reference_assets = test_dict["reference_assets"]

    output_img = [x[1] for x in output_assets if x[0] == "img"]
    reference_img = [x[1] for x in reference_assets if x[0] == "img"]

    if len(output_img) != len(reference_img):
        return {
            "test": test_dict["test"],
            "success": False,
            "reason": {
                "type": "WrongArtifactAmount",
            },
        }

    if not all_images_are_similar(output_img, reference_img):
        print("Similarities not matching!")
        # print_failing_similarity_reports(output_img, reference_img)

        return {
            "test": test_dict["test"],
            "success": False,
            "reason": {
                "type": "NoMatchingImg",
                "out": output_img,
                "reference": reference_img,
            },
        }


    output_json = [x[1] for x in output_assets if x[0] == "json"]
    reference_json = [x[1] for x in reference_assets if x[0] == "json"]

    if len(output_json) != len(reference_json):
        return {
            "test": test_dict["test"],
            "success": False,
            "reason": {
                "type": "WrongArtifactAmount",
            },
        }

    if not compare_json_arrays(output_json, reference_json):
        return {
            "test": test_dict["test"],
            "success": False,
            "reason": {
                "type": "NoMatchingJson",
                "out": output_json,
                "reference": reference_json,
            },
        }

    return {
        "test": test_dict["test"],
        "success": True,
    }

def test_for_error_file(test: str) -> str | None:
    error_file_path = os.path.join(BASE_DIR, "test_output", test, "error.txt")

    if not os.path.isfile(error_file_path):
        return None

    with open(error_file_path, "r", encoding="utf-8") as f:
        return f.read()

def main() -> None:
    test_results: list[TestResult] = []

    test_dirs = list_directories("test_output")

    for test in test_dirs:
        error_text = test_for_error_file(test)
        if error_text is not None:
            test_results.append(
                {
                    "test": test,
                    "success": False,
                    "reason": {
                        "type": "BuildError",
                        "error": error_text,
                    },
                }
            )
            continue   
        
        test_dict = create_test_dictionary(test)
        test_result = perform_test(test_dict)
        test_results.append(test_result)

    for test in test_results:
        if test["success"]:
            print(colored("Passed: ", "green"), test["test"])
    
    failed_tests = [
        test for test in test_results if not test["success"]
    ]

    for test in failed_tests:
        print(
            colored("Failed | " + test["reason"]["type"] + ":", "red"),
            colored(test["test"], "magenta"),
        )
    
    failed_file = os.path.join(BASE_DIR, "../Server/watch/failed_tests.fjson")

    if failed_tests:
        with open(failed_file, "w", encoding="utf-8") as f:
            json.dump({
                "type": "failedTest",
                "value": failed_tests,
                "title": "!failedTests",
                "stack": "<Test Case>"
            }, f)

        print("Failures written to", failed_file)
    else:
        if os.path.exists(failed_file):
            os.remove(failed_file)


if __name__ == "__main__":
    main()
