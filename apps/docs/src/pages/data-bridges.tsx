import { useEffect } from "react";
import { useHistory } from "@docusaurus/router";

export default function DataBridgesRedirect(): null {
  const history = useHistory();

  useEffect(() => {
    history.replace(`/data-connectors${window.location.search}${window.location.hash}`);
  }, [history]);

  return null;
}
