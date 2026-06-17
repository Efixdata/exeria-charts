import * as React from "react";
import { PaintBrush } from "phosphor-react";

const Brush = (props) => (
  <PaintBrush size={18} weight="fill" aria-hidden {...props} />
);

export default Brush;
