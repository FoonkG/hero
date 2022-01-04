import { IKeyboardKeyCode } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import {
  IElementInteractVerification,
  IMousePositionXY,
} from '@ulixee/hero-interfaces/IInteractions';
import { ISuperElement, ISuperNode } from 'awaited-dom/base/interfaces/super';

export type IInteraction = ICommand | ICommandDetailed;
type IInteractions = IInteraction[];

export default IInteractions;

export enum Command {
  scroll = 'scroll',
  move = 'move',

  click = 'click',
  clickLeft = 'clickLeft',
  clickMiddle = 'clickMiddle',
  clickRight = 'clickRight',

  clickDown = 'clickDown',
  clickDownLeft = 'clickDownLeft',
  clickDownMiddle = 'clickDownMiddle',
  clickDownRight = 'clickDownRight',

  clickUp = 'clickUp',
  clickUpLeft = 'clickUpLeft',
  clickUpMiddle = 'clickUpMiddle',
  clickUpRight = 'clickUpRight',

  doubleclick = 'doubleclick',
  doubleclickLeft = 'doubleclickLeft',
  doubleclickMiddle = 'doubleclickMiddle',
  doubleclickRight = 'doubleclickRight',

  keyPress = 'keyPress',
  keyDown = 'keyDown',
  keyUp = 'keyUp',
  type = 'type',

  waitForNode = 'waitForNode',
  waitForElementVisible = 'waitForElementVisible',
  waitForMillis = 'waitForMillis',
}

export type ICommand = keyof typeof Command;

export interface ICommandDetailed {
  [Command.scroll]?: IMousePositionXY | ISuperElement;
  [Command.move]?: IMousePositionXY | ISuperElement;
  [Command.click]?: IMousePositionXY | ISuperElement | ISuperElementWithVerification;
  [Command.clickLeft]?: IMousePositionXY | ISuperElement;
  [Command.clickMiddle]?: IMousePositionXY | ISuperElement;
  [Command.clickRight]?: IMousePositionXY | ISuperElement;
  [Command.doubleclick]?: IMousePositionXY | ISuperElement | ISuperElementWithVerification;
  [Command.doubleclickLeft]?: IMousePositionXY | ISuperElement;
  [Command.doubleclickMiddle]?: IMousePositionXY | ISuperElement;
  [Command.doubleclickRight]?: IMousePositionXY | ISuperElement;
  [Command.clickUp]?: IMousePositionXY | ISuperElement;
  [Command.clickUpLeft]?: IMousePositionXY | ISuperElement;
  [Command.clickUpMiddle]?: IMousePositionXY | ISuperElement;
  [Command.clickUpRight]?: IMousePositionXY | ISuperElement;
  [Command.clickDown]?: IMousePositionXY | ISuperElement;
  [Command.clickDownLeft]?: IMousePositionXY | ISuperElement;
  [Command.clickDownMiddle]?: IMousePositionXY | ISuperElement;
  [Command.clickDownRight]?: IMousePositionXY | ISuperElement;

  [Command.type]?: ITypeInteraction;
  [Command.keyPress]?: IKeyboardKeyCode;
  [Command.keyUp]?: IKeyboardKeyCode;
  [Command.keyDown]?: IKeyboardKeyCode;

  [Command.waitForNode]?: ISuperNode;
  [Command.waitForElementVisible]?: ISuperElement;
  [Command.waitForMillis]?: number;
}

export type ITypeInteraction = string | IKeyboardKeyCode;

export type ISuperElementWithVerification = {
  element: ISuperElement;
  verification: IElementInteractVerification;
};
