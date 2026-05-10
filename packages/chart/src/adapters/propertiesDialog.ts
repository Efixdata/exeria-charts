export interface DialogActionHandle {
  dismiss(keepMounted?: boolean): void;
}

export interface DialogAction {
  myClass?: string;
  title: string;
  callback(this: DialogActionHandle): void;
}

export type PropertiesEditorOptions = {
  properties: Record<string, string>;
  locale?: Record<string, string>;
  inputClass?: string;
};

export interface PropertiesDialogWidget {
  addClass(className: string): PropertiesDialogWidget;
  empty(): PropertiesDialogWidget;
  simplePropertiesEditor(options: PropertiesEditorOptions): PropertiesDialogWidget;
  simplePropertiesEditor(command: "getValues"): Record<string, string>;
  simplePropertiesEditor(command: "focus"): PropertiesDialogWidget;
  rcpDialog(options: {
    content: PropertiesDialogWidget;
    title: string;
    actions: DialogAction[];
    onShown?: () => void;
  }): PropertiesDialogWidget;
  rcpDialog(command: "showDialog", modal: boolean): PropertiesDialogWidget;
}

export type PropertiesDialogOptions = {
  content: PropertiesDialogWidget;
  title: string;
  actions: DialogAction[];
  onShown?: () => void;
  dialogClass?: string;
  modal?: boolean;
};

declare const $: (markup: string) => PropertiesDialogWidget;

export function createDialogWidget(markup = "<div></div>"): PropertiesDialogWidget {
  return $(markup);
}

export function createPropertiesDialogContent(
  options: PropertiesEditorOptions,
): PropertiesDialogWidget {
  return createDialogWidget().simplePropertiesEditor(options);
}

export function showPropertiesDialog(options: PropertiesDialogOptions): PropertiesDialogWidget {
  const dialog = createDialogWidget();

  if (options.dialogClass) {
    dialog.addClass(options.dialogClass);
  }

  dialog
    .rcpDialog({
      content: options.content,
      title: options.title,
      actions: options.actions,
      onShown: options.onShown,
    })
    .rcpDialog("showDialog", options.modal ?? false);

  return dialog;
}