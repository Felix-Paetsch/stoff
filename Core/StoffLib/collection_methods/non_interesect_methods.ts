export default (Class, set_if_not_exists) => {
    set_if_not_exists(Class, "get_bounding_box", function () {
        return "booh"
    })
}
