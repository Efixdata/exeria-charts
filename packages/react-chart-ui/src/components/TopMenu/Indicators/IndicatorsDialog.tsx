import * as React from "react";
import { useState, useContext, useEffect, useMemo } from "react";
import { useStableId } from "../../../utils/useStableId";
import {
  DialogHeader,
  DialogHeaderActions,
  DialogHeaderTitle,
  DialogBody,
  DialogContainer,
  ListItem,
  ListItemsWrapper,
  TextInput,
  TextButton,
  Form,
} from "ui";
import { MagnifyingGlass, X } from "phosphor-react";
import Fuse from "fuse.js";
import { IndicatorSettingsDialog } from "./IndicatorSettingsDialog";
import { ThemeContext } from "styled-components";
import type { NullableChartInstance } from "../../../chartTypes";
import { useChartTranslate } from "../../../hooks/useChartTranslate";
import { getIndicatorDialogCssVars } from "../../../utils/dialogThemeVars";
import tabStyles from "../../dialog/dialogTabs.module.css";
import layoutStyles from "../../dialog/dialogLayout.module.css";
import {
  dialogCatalogBodyStyle,
  getDialogCatalogLayoutStyle,
} from "../../dialog/dialogLayout";
import { useChartEnvironment } from "../../../hooks/useChartEnvironment";

export interface IndicatorDefinition {
  key: string;
  title: string;
  description: string;
  type?: string;
  showAsType?: string;
  inputs?: Record<string, any>;
  [key: string]: any;
}

type ScriptCatalogTab = "indicators" | "functions" | "strategies";

interface IndicatorsDialogProps {
  onClose: () => void;
  indicators: IndicatorDefinition[];
  functions: IndicatorDefinition[];
  strategies: IndicatorDefinition[];
  chart: NullableChartInstance;
  editScriptId?: string | number | null;
  style?: React.CSSProperties;
}

const TAB_LABEL_KEYS: Record<ScriptCatalogTab, string> = {
  indicators: "catalog_tab_indicator",
  functions: "catalog_tab_function",
  strategies: "catalog_tab_strategy",
};

export const IndicatorsDialog = (props: IndicatorsDialogProps) => {
  const { isCompact } = useChartEnvironment();
  const t = useChartTranslate(props.chart);
  const titleId = useStableId("indicators-title");
  const tabsId = useStableId("indicators-tabs");
  const [activeTab, setActiveTab] = useState<ScriptCatalogTab>("indicators");
  const [searchQuery, setSearchQuery] = useState("");
  const [chosenIndicator, setChosenIndicator] = useState<IndicatorDefinition | null>(null);

  const catalogByTab = useMemo(
    () => ({
      indicators: props.indicators,
      functions: props.functions,
      strategies: props.strategies,
    }),
    [props.indicators, props.functions, props.strategies],
  );

  const activeScripts = catalogByTab[activeTab];

  const filteredScripts = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) {
      return activeScripts;
    }

    const fuse = new Fuse(activeScripts, {
      includeScore: false,
      shouldSort: true,
      keys: ["title", "description", "key"],
    });

    return fuse.search(query).map((result) => result.item);
  }, [activeScripts, searchQuery]);

  useEffect(() => {
    if (props.editScriptId == null || !props.chart?.getIndicatorEditConfig) {
      return;
    }

    const definition = props.chart.getIndicatorEditConfig(props.editScriptId);
    if (definition) {
      const scriptType = props.chart.getScripts()?.[definition.key]?.type;
      if (scriptType === "functions") {
        setActiveTab("functions");
      } else if (scriptType === "strategies") {
        setActiveTab("strategies");
      } else {
        setActiveTab("indicators");
      }
      setChosenIndicator(definition as IndicatorDefinition);
    }
  }, [props.editScriptId, props.chart]);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // styled-components in this workspace pulls a mismatched React context type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const themeContext = useContext(ThemeContext);
  const dialogThemeVars = getIndicatorDialogCssVars(themeContext);

  const renderDialogBody = () => {
    const listItems = filteredScripts.map((script) => (
      <ListItem
        key={script.key}
        title={script.title}
        subtitle={script.description}
        onClick={() => {
          onScriptPick(script);
        }}
      />
    ));

    return (
      <div
        className={`${layoutStyles.catalogListPanel} ${isCompact ? layoutStyles.catalogListPanelCompact : ""}`}
      >
        {listItems.length === 0 ? (
          <div className={layoutStyles.emptyState}>{t("noResults", "NO RESULTS")}</div>
        ) : (
          <div className={layoutStyles.catalogListInner}>
            <ListItemsWrapper>{listItems}</ListItemsWrapper>
          </div>
        )}
      </div>
    );
  };

  const onScriptPick = (script: IndicatorDefinition) => {
    setChosenIndicator(script);
  };

  const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const renderTabs = () => {
    return (
      <div
        id={tabsId}
        className={tabStyles.tabBar}
        role="tablist"
        aria-label={t("catalog_dialog_title", "ADD INDICATOR TO CHART")}
      >
        {(Object.keys(TAB_LABEL_KEYS) as ScriptCatalogTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${tabsId}-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`${tabsId}-${tab}-panel`}
            className={`${tabStyles.tab} ${activeTab === tab ? tabStyles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(TAB_LABEL_KEYS[tab])}
            {catalogByTab[tab].length > 0 ? ` (${catalogByTab[tab].length})` : ""}
          </button>
        ))}
      </div>
    );
  };

  const renderSearchBar = () => {
    return (
      <div className={layoutStyles.searchBar}>
        <Form onSubmit={onSubmit} style={{ width: "100%", gap: 0 }}>
          <TextInput
            autoFocus
            type="text"
            value={searchQuery}
            onChange={onQueryChange}
            placeholder={t("search", "Search...")}
            aria-label={t("search", "Search...")}
            style={{ width: "100%" }}
          />
        </Form>
        <MagnifyingGlass size={20} className={layoutStyles.searchIcon} />
      </div>
    );
  };

  const renderDialogHeader = () => {
    return (
      <DialogHeader>
        <DialogHeaderTitle id={titleId}>
          {t("catalog_dialog_title", "ADD INDICATOR TO CHART")}
        </DialogHeaderTitle>
        <DialogHeaderActions>
          <TextButton onClick={props.onClose} ariaLabel={t("dialog_close", "Close")}>
            <X size={24} aria-hidden />
          </TextButton>
        </DialogHeaderActions>
      </DialogHeader>
    );
  };

  const renderIndicatorsDialog = () => {
    return (
      <DialogContainer
        ariaLabelledBy={titleId}
        style={{
          ...dialogThemeVars,
          ...getDialogCatalogLayoutStyle(isCompact),
          ...props.style,
        }}
      >
        {renderDialogHeader()}
        {renderTabs()}
        {renderSearchBar()}
        <DialogBody
          id={`${tabsId}-${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${activeTab}`}
          style={dialogCatalogBodyStyle}
        >
          {renderDialogBody()}
        </DialogBody>
      </DialogContainer>
    );
  };

  if (chosenIndicator) {
    return (
      <IndicatorSettingsDialog
        chart={props.chart}
        indicator={chosenIndicator as any}
        onClose={() => {
          props.onClose();
        }}
        onBack={() => {
          if (chosenIndicator?.id != null) {
            props.onClose();
          } else {
            setChosenIndicator(null);
          }
        }}
      />
    );
  }

  return renderIndicatorsDialog();
};
