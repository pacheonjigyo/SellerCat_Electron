import React from "react";

import { orderStore } from "./stores";

export function createStores() {
    return {
        orderStore: new orderStore(),
    };
}

export const stores = createStores();
export const AppContext = React.createContext(stores);