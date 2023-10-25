import React from "react";
import "./components.css";
import { Icon } from "@iconify/react";

const SearchNotificationBar = () => {
  return (
    <div className="search-notification-bar">
      <div className="search-bar">
        <input type="text" className="form-control" placeholder="Search" />
        <Icon icon="material-symbols:search" className="search-icon" />
      </div>
      <div className="notification-email">
        <Icon icon="tabler:mail" className="n-e-icon" />

        <Icon icon="lucide:bell" className="n-e-icon" />

        <img src="/img/Frame54.png" alt="avartar" />
      </div>
    </div>
  );
};

export default SearchNotificationBar;
