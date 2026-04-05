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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GrayscaleRequest {
    pub enabled: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DarkModeRequest {
    pub enabled: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BarNetworksRequest {
    pub network_ids: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetProfilesRequest {
    pub profiles_json: String,
    pub active_profile_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetLocaleRequest {
    pub locale: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteSessionRequest {
    pub profile_id: String,
    pub network_id: String,
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

    pub fn set_grayscale(&self, enabled: bool) -> Result<()> {
        self.0
            .run_mobile_plugin("setGrayscale", GrayscaleRequest { enabled })
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn set_dark_mode(&self, enabled: bool) -> Result<()> {
        self.0
            .run_mobile_plugin("setDarkMode", DarkModeRequest { enabled })
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn set_bar_networks(&self, network_ids: Vec<String>) -> Result<()> {
        self.0
            .run_mobile_plugin("setBarNetworks", BarNetworksRequest { network_ids })
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn set_profiles(&self, profiles_json: String, active_profile_id: String) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "setProfiles",
                SetProfilesRequest {
                    profiles_json,
                    active_profile_id,
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn set_locale(&self, locale: String) -> Result<()> {
        self.0
            .run_mobile_plugin("setLocale", SetLocaleRequest { locale })
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn delete_network_session(&self, profile_id: &str, network_id: &str) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "deleteNetworkSession",
                DeleteSessionRequest {
                    profile_id: profile_id.to_string(),
                    network_id: network_id.to_string(),
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }

    pub fn delete_profile_session(&self, profile_id: &str) -> Result<()> {
        self.0
            .run_mobile_plugin(
                "deleteProfileSession",
                DeleteSessionRequest {
                    profile_id: profile_id.to_string(),
                    network_id: String::new(),
                },
            )
            .map_err(|e| Error::PluginInvoke(e.to_string()))
    }
}
