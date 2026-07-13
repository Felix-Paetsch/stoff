pub trait WASMWrapper<T> {
    fn inner(&self) -> &T;
    fn inner_mut(&mut self) -> &mut T;
    fn into_inner(self) -> T;
    fn promote(value: T) -> Self;

    #[allow(unused)]
    // Swaps what is stored inside the wrapper, putting the new value behing the value pointer
    fn mem_swap(&mut self, value: &mut T) {
        std::mem::swap(self.inner_mut(), value);
    }

    #[allow(unused)]
    // Swaps what is stored inside the wrapper, returning the old value
    fn mem_replace(&mut self, value: T) -> T {
        std::mem::replace(self.inner_mut(), value)
    }
}
