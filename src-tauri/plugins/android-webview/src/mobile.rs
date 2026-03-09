use serde::Serialize;
use tauri::{plugin::PluginHandle, Runtime};

use crate::error::{Error, Result};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRequest {
    pub url: String,
    pub account_id: String,
    pub network_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountRequest {
    pub account_id: String,
}

pub struct AndroidWebview<R: Runtime>(pub PluginHandle<R>);

impl<R: Runtime> AndroidWebview<R> {
    pub fn open(&self, url: &str, account_id: &str, network_id: &str) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "openWebView",
                OpenRequest {
                    url: url.to_string(),
                    account_id: account_id.to_string(),
                    network_id: network_id.to_string(),
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn close(&self, account_id: &str) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "closeWebView",
                AccountRequest {
                    account_id: account_id.to_string(),
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn show(&self, account_id: &str) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "showWebView",
                AccountRequest {
                    account_id: account_id.to_string(),
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn hide(&self) -> Result<()> {
        self.0
            .run_mobile_plugin::<()>("hideWebView", ())
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }
}
