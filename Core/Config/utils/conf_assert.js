export default (bool, error) => {
    if (!bool){
        throw new Error(error);
    }
    return true;
}