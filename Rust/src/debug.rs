#[cfg(debug_assertions)]
pub fn debug_log_impl(args: &[wasm_bindgen::JsValue]) {
    use wasm_bindgen::JsValue;
    match args.len() {
        1 => web_sys::console::log_1(&args[0]),
        2 => web_sys::console::log_2(&args[0], &args[1]),
        3 => web_sys::console::log_3(&args[0], &args[1], &args[2]),
        4 => web_sys::console::log_4(&args[0], &args[1], &args[2], &args[3]),
        5 => web_sys::console::log_5(&args[0], &args[1], &args[2], &args[3], &args[4]),
        6 => web_sys::console::log_6(&args[0], &args[1], &args[2], &args[3], &args[4], &args[5]),
        7 => web_sys::console::log_7(
            &args[0], &args[1], &args[2], &args[3], &args[4], &args[5], &args[6],
        ),
        _ => {
            // Fallback: format all args into one string
            let combined = args
                .iter()
                .map(|v| format!("{:?}", v))
                .collect::<Vec<_>>()
                .join(" ");
            web_sys::console::log_1(&JsValue::from_str(&combined));
        }
    }
}

#[macro_export]
macro_rules! debug_log {
    ( $( $x:expr ),* $(,)? ) => {
        #[cfg(debug_assertions)]
        {
            let args: Vec<wasm_bindgen::JsValue> = vec![
                $(
                    wasm_bindgen::JsValue::from_str(
                        &format!("{:?}", $x)
                    )
                ),*
            ];
            $crate::debug::debug_log_impl(&args);
        }
    };
}
