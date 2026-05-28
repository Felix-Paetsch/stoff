use std::fmt::Debug;

pub fn debug_log_1<T: Debug>(item: T) {
    let debug_string = format!("{:?}", item);
    web_sys::console::log_1(&debug_string.into());
}

pub fn debug_log_2<T: Debug, S: Debug>(item1: T, item2: S) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    web_sys::console::log_2(&debug_string1.into(), &debug_string2.into());
}

pub fn debug_log_3<T: Debug, S: Debug, U: Debug>(item1: T, item2: S, item3: U) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    let debug_string3 = format!("{:?}", item3);
    web_sys::console::log_3(
        &debug_string1.into(),
        &debug_string2.into(),
        &debug_string3.into(),
    );
}

pub fn debug_log_4<T: Debug, S: Debug, U: Debug, V: Debug>(item1: T, item2: S, item3: U, item4: V) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    let debug_string3 = format!("{:?}", item3);
    let debug_string4 = format!("{:?}", item4);
    web_sys::console::log_4(
        &debug_string1.into(),
        &debug_string2.into(),
        &debug_string3.into(),
        &debug_string4.into(),
    );
}

pub fn debug_log_5<T: Debug, S: Debug, U: Debug, V: Debug, W: Debug>(
    item1: T,
    item2: S,
    item3: U,
    item4: V,
    item5: W,
) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    let debug_string3 = format!("{:?}", item3);
    let debug_string4 = format!("{:?}", item4);
    let debug_string5 = format!("{:?}", item5);
    web_sys::console::log_5(
        &debug_string1.into(),
        &debug_string2.into(),
        &debug_string3.into(),
        &debug_string4.into(),
        &debug_string5.into(),
    );
}

pub fn debug_log_6<T: Debug, S: Debug, U: Debug, V: Debug, W: Debug, X: Debug>(
    item1: T,
    item2: S,
    item3: U,
    item4: V,
    item5: W,
    item6: X,
) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    let debug_string3 = format!("{:?}", item3);
    let debug_string4 = format!("{:?}", item4);
    let debug_string5 = format!("{:?}", item5);
    let debug_string6 = format!("{:?}", item6);
    web_sys::console::log_6(
        &debug_string1.into(),
        &debug_string2.into(),
        &debug_string3.into(),
        &debug_string4.into(),
        &debug_string5.into(),
        &debug_string6.into(),
    );
}

pub fn debug_log_7<T: Debug, S: Debug, U: Debug, V: Debug, W: Debug, X: Debug, Y: Debug>(
    item1: T,
    item2: S,
    item3: U,
    item4: V,
    item5: W,
    item6: X,
    item7: Y,
) {
    let debug_string1 = format!("{:?}", item1);
    let debug_string2 = format!("{:?}", item2);
    let debug_string3 = format!("{:?}", item3);
    let debug_string4 = format!("{:?}", item4);
    let debug_string5 = format!("{:?}", item5);
    let debug_string6 = format!("{:?}", item6);
    let debug_string7 = format!("{:?}", item7);
    web_sys::console::log_7(
        &debug_string1.into(),
        &debug_string2.into(),
        &debug_string3.into(),
        &debug_string4.into(),
        &debug_string5.into(),
        &debug_string6.into(),
        &debug_string7.into(),
    );
}
