import React from 'react';
import { type Except } from 'type-fest';
import { type Styles } from '../styles.js';
import { type DOMElement } from '../dom.js';
export type Props = Except<Styles, 'textWrap'>;
/**
 * `<Box>` is an essential Ink component to build your layout. It's like `<div style="display: flex">` in the browser.
 */
declare const Box: React.ForwardRefExoticComponent<Props & {
    children?: React.ReactNode;
} & React.RefAttributes<DOMElement>>;
export default Box;
