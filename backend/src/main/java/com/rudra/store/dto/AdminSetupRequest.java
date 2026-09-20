package com.rudra.store.dto;

public class AdminSetupRequest {
    private String setupSecret;

    public AdminSetupRequest() {
    }

    public AdminSetupRequest(String setupSecret) {
        this.setupSecret = setupSecret;
    }

    public String getSetupSecret() {
        return setupSecret;
    }

    public void setSetupSecret(String setupSecret) {
        this.setupSecret = setupSecret;
    }
}
