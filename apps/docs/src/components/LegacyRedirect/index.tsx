import { useEffect } from "react";
import { useHistory } from "@docusaurus/router";

type LegacyRedirectProps = {
  to: string;
};

export default function LegacyRedirect({ to }: LegacyRedirectProps): null {
  const history = useHistory();

  useEffect(() => {
    history.replace(`${to}${window.location.search}${window.location.hash}`);
  }, [history, to]);

  return null;
}
