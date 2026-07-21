use proc_macro::TokenStream;
use quote::quote;
use syn::{Data, DeriveInput, Fields, parse_macro_input};

#[proc_macro_derive(WASMWrapper)]
pub fn derive_wasm_wrapper(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = input.ident;

    let inner_ty = match input.data {
        Data::Struct(data_struct) => match data_struct.fields {
            Fields::Unnamed(fields) => {
                if fields.unnamed.len() != 1 {
                    return syn::Error::new_spanned(
                        name,
                        "WASMWrapper can only be derived for tuple structs with exactly one field",
                    )
                    .to_compile_error()
                    .into();
                }

                fields.unnamed.first().unwrap().ty.clone()
            }
            _ => {
                return syn::Error::new_spanned(
                    name,
                    "WASMWrapper can only be derived for tuple structs",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(name, "WASMWrapper can only be derived for structs")
                .to_compile_error()
                .into();
        }
    };

    let expanded = quote! {
        impl crate::wasm::WASMWrapper<#inner_ty> for #name {
            fn promote(value: #inner_ty) -> Self {
                #name(value)
            }

            fn inner(&self) -> &#inner_ty {
                &self.0
            }

            fn inner_mut(&mut self) -> &mut #inner_ty {
                &mut self.0
            }

            fn into_inner(self) -> #inner_ty {
                self.0
            }
        }

        impl<'a> From<&'a #name> for &'a #inner_ty {
            fn from(value: &'a #name) -> Self {
                &value.0
            }
        }

        impl From<#inner_ty> for #name {
            fn from(value: #inner_ty) -> Self {
                #name(value)
            }
        }
    };

    TokenStream::from(expanded)
}
