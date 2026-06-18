import { useState } from "react";
import clsx from "clsx";
import SearchBar from "@theme/SearchBar";
import "./docsSearch.css";
import styles from "./styles.module.css";

export default function DocsSidebarSearch(): JSX.Element {
  return (
    <div
      className={clsx(styles.root)}
      data-docs-sidebar-search=""
    >
      <SearchBar />
    </div>
  );
}
