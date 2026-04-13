module.exports = function checkValidName(inputName) {
    if (inputName.trim().length < 3){
        return "Name should be at least 3 characters long"
    }
    if (inputName.length > 60){
        return "Name should be at most 60 characters long"
    }

    // The uniqueness is enforced by SQL rule
    const regex = /^[a-zA-Z0-9äöüÄÖÜ][a-zA-Z0-9()\ -äüöÄÜÖ]+$/;

    if (!regex.test(inputName)){
        return `The name may fit the regex /[a-zA-Z0-9äöüÄÜÖ][a-zA-Z0-9()\ -äöüÄÖÜ]+/`
    }

    return true;
}