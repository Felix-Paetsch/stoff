document.addEventListener("DOMContentLoaded", function () {
    function sortList(ul) {
        let items = Array.from(ul.children);
        items.sort((a, b) => {
            let textA = a.textContent.trim().toLowerCase();
            let textB = b.textContent.trim().toLowerCase();
            return textA.localeCompare(textB);
        });
        items.forEach(item => ul.appendChild(item));
    }

    function sortListsInContainer(container, sortAll) {
        let lists = container.querySelectorAll("ul");
        lists.forEach(ul => {
            if (sortAll) {
                sortList(ul);
            } else {
                let hasNestedList = Array.from(ul.children).some(li => li.querySelector("ul"));
                if (!hasNestedList) {
                    sortList(ul);
                }
            }
        });
    }

    // Set to true to sort all lists, false to sort only inner lists (default)
    const tocTreeContainerSortAll = false;
    const toctreeWrapperCompoundSortAll = false;

    let tocTreeContainer = document.querySelector(".toc-tree-container");
    if (tocTreeContainer) {
        sortListsInContainer(tocTreeContainer, tocTreeContainerSortAll);
    }

    let toctreeWrapperCompound = document.querySelector(".toctree-wrapper.compound");
    if (toctreeWrapperCompound) {
        sortListsInContainer(toctreeWrapperCompound, toctreeWrapperCompoundSortAll);
    }
});
  