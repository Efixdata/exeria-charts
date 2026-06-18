import { useState } from "react";
import clsx from "clsx";
import SearchBar from "@theme/SearchBar";
import "./docsSearch.css";
import styles from "./styles.module.css";

export default function DocsSidebarSearch(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={clsx(styles.root, isOpen && styles.open)}
      data-docs-sidebar-search=""
      data-search-active={isOpen ? "true" : "false"}
    >
      {/* @ts-ignore */}
      <SearchBar handleSearchBarToggle={setIsOpen} />
    </div>
  );
}
