import React, { useState } from "react";
import "./components.css";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";

const Navbar: React.FC = () => {
  const [activeNavItem, setActiveNavItem] = useState<number | null>(null);
  const [showSettingsSubMenu, setShowSettingsSubMenu] = useState(false);
  const [showServicePackage, setShowServicePackage] = useState(false);

  const handleNavItemClick = (index: number) => {
    setActiveNavItem(index);
  };

  const isSublinkActive = (path: string) => {
    return window.location.pathname.startsWith(path);
  };

  const getNavLinkClass = (path: string) => {
    return activeNavItem === 3 && !showSettingsSubMenu && path === "/settings"
      ? "settings-parent active"
      : isSublinkActive(path)
      ? "active"
      : "";
  };

  const handleSettingsMouseEnter = () => {
    setShowServicePackage(true);
  };

  const handleSettingsMouseLeave = () => {
    setShowServicePackage(false);
  };

  return (
    <div className="menu">
      <div className="navbar">
        <div className="logo">
          <NavLink to="/*">
            <img src="/img/insight-05.png" alt="Logo" />
          </NavLink>
        </div>
        <ul className="navigation">
          <li
            className={getNavLinkClass("/*")}
            onClick={() => handleNavItemClick(0)}
          >
            <NavLink to="/*" onClick={() => handleNavItemClick(0)}>
              <Icon icon="bx:home-alt" /> Trang chủ
            </NavLink>
          </li>

          <li
            className={getNavLinkClass("/manage-tickets")}
            onClick={() => handleNavItemClick(1)}
          >
            <NavLink to="/manage-tickets" onClick={() => handleNavItemClick(1)}>
              <Icon icon="uil:ticket" /> Quản lý vé
            </NavLink>
          </li>
          <li
            className={getNavLinkClass("/ticket-reconciliation")}
            onClick={() => handleNavItemClick(2)}
          >
            <NavLink
              to="/ticket-reconciliation"
              onClick={() => handleNavItemClick(2)}
            >
              <Icon icon="basil:invoice-outline" /> Đối soát vé
            </NavLink>
          </li>
          <li
            className={getNavLinkClass("/settings")}
            onMouseEnter={handleSettingsMouseEnter}
            onMouseLeave={handleSettingsMouseLeave}
          >
            <NavLink
              to="/settings/service-package"
              onClick={() => handleNavItemClick(3)}
            >
              <Icon icon="uil:setting" /> Cài đặt
            </NavLink>

            {showServicePackage && (
              <div className="service-package">
                <ul>
                  <li>
                    <NavLink
                      to="/settings/service-package"
                      className={getNavLinkClass("/settings/service-package")}
                    >
                      Gói dịch vụ
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </li>
        </ul>
      </div>
      <div className="copyright">
        Copyright &copy; {new Date().getFullYear()} Alta Software
      </div>
    </div>
  );
};

export default Navbar;
