import { EventEmitter } from 'node:events';
import process from 'node:process';
import React, { PureComponent } from 'react';
import cliCursor from 'cli-cursor';
import AppContext from './AppContext.js';
import StdinContext from './StdinContext.js';
import StdoutContext from './StdoutContext.js';
import StderrContext from './StderrContext.js';
import FocusContext from './FocusContext.js';
import ErrorOverview from './ErrorOverview.js';
const tab = '\t';
const shiftTab = '\u001B[Z';
const escape = '\u001B';
// Root component for all Ink apps
// It renders stdin and stdout contexts, so that children can access them if needed
// It also handles Ctrl+C exiting and cursor visibility
export default class App extends PureComponent {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                isFocusEnabled: true,
                activeFocusId: undefined,
                focusables: [],
                error: undefined
            }
        });
        // Count how many components enabled raw mode to avoid disabling
        // raw mode until all components don't need it anymore
        Object.defineProperty(this, "rawModeEnabledCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Object.defineProperty(this, "internal_eventEmitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new EventEmitter()
        });
        Object.defineProperty(this, "handleSetRawMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (isEnabled) => {
                const { stdin } = this.props;
                if (!this.isRawModeSupported()) {
                    if (stdin === process.stdin) {
                        throw new Error('Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported');
                    }
                    else {
                        throw new Error('Raw mode is not supported on the stdin provided to Ink.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported');
                    }
                }
                stdin.setEncoding('utf8');
                if (isEnabled) {
                    // Ensure raw mode is enabled only once
                    if (this.rawModeEnabledCount === 0) {
                        stdin.ref();
                        stdin.setRawMode(true);
                        stdin.addListener('readable', this.handleReadable);
                    }
                    this.rawModeEnabledCount++;
                    return;
                }
                // Disable raw mode only when no components left that are using it
                if (--this.rawModeEnabledCount === 0) {
                    stdin.setRawMode(false);
                    stdin.removeListener('readable', this.handleReadable);
                    stdin.unref();
                }
            }
        });
        Object.defineProperty(this, "handleReadable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                let chunk;
                // eslint-disable-next-line @typescript-eslint/ban-types
                while ((chunk = this.props.stdin.read()) !== null) {
                    this.handleInput(chunk);
                    this.internal_eventEmitter.emit('input', chunk);
                }
            }
        });
        Object.defineProperty(this, "handleInput", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (input) => {
                // Exit on Ctrl+C
                // eslint-disable-next-line unicorn/no-hex-escape
                if (input === '\x03' && this.props.exitOnCtrlC) {
                    this.handleExit();
                }
                // Reset focus when there's an active focused component on Esc
                if (input === escape && this.state.activeFocusId) {
                    this.setState({
                        activeFocusId: undefined
                    });
                }
                if (this.state.isFocusEnabled && this.state.focusables.length > 0) {
                    if (input === tab) {
                        this.focusNext();
                    }
                    if (input === shiftTab) {
                        this.focusPrevious();
                    }
                }
            }
        });
        Object.defineProperty(this, "handleExit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (error) => {
                if (this.isRawModeSupported()) {
                    this.handleSetRawMode(false);
                }
                this.props.onExit(error);
            }
        });
        Object.defineProperty(this, "enableFocus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState({
                    isFocusEnabled: true
                });
            }
        });
        Object.defineProperty(this, "disableFocus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState({
                    isFocusEnabled: false
                });
            }
        });
        Object.defineProperty(this, "focus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (id) => {
                this.setState(previousState => {
                    const hasFocusableId = previousState.focusables.some(focusable => focusable?.id === id);
                    if (!hasFocusableId) {
                        return previousState;
                    }
                    return { activeFocusId: id };
                });
            }
        });
        Object.defineProperty(this, "focusNext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState(previousState => {
                    const firstFocusableId = previousState.focusables[0]?.id;
                    const nextFocusableId = this.findNextFocusable(previousState);
                    return {
                        activeFocusId: nextFocusableId ?? firstFocusableId
                    };
                });
            }
        });
        Object.defineProperty(this, "focusPrevious", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState(previousState => {
                    const lastFocusableId = previousState.focusables[previousState.focusables.length - 1]?.id;
                    const previousFocusableId = this.findPreviousFocusable(previousState);
                    return {
                        activeFocusId: previousFocusableId ?? lastFocusableId
                    };
                });
            }
        });
        Object.defineProperty(this, "addFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (id, { autoFocus }) => {
                this.setState(previousState => {
                    let nextFocusId = previousState.activeFocusId;
                    if (!nextFocusId && autoFocus) {
                        nextFocusId = id;
                    }
                    return {
                        activeFocusId: nextFocusId,
                        focusables: [
                            ...previousState.focusables,
                            {
                                id,
                                isActive: true
                            }
                        ]
                    };
                });
            }
        });
        Object.defineProperty(this, "removeFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (id) => {
                this.setState(previousState => ({
                    activeFocusId: previousState.activeFocusId === id
                        ? undefined
                        : previousState.activeFocusId,
                    focusables: previousState.focusables.filter(focusable => {
                        return focusable.id !== id;
                    })
                }));
            }
        });
        Object.defineProperty(this, "activateFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (id) => {
                this.setState(previousState => ({
                    focusables: previousState.focusables.map(focusable => {
                        if (focusable.id !== id) {
                            return focusable;
                        }
                        return {
                            id,
                            isActive: true
                        };
                    })
                }));
            }
        });
        Object.defineProperty(this, "deactivateFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (id) => {
                this.setState(previousState => ({
                    activeFocusId: previousState.activeFocusId === id
                        ? undefined
                        : previousState.activeFocusId,
                    focusables: previousState.focusables.map(focusable => {
                        if (focusable.id !== id) {
                            return focusable;
                        }
                        return {
                            id,
                            isActive: false
                        };
                    })
                }));
            }
        });
        Object.defineProperty(this, "findNextFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (state) => {
                const activeIndex = state.focusables.findIndex(focusable => {
                    return focusable.id === state.activeFocusId;
                });
                for (let index = activeIndex + 1; index < state.focusables.length; index++) {
                    const focusable = state.focusables[index];
                    if (focusable?.isActive) {
                        return focusable.id;
                    }
                }
                return undefined;
            }
        });
        Object.defineProperty(this, "findPreviousFocusable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (state) => {
                const activeIndex = state.focusables.findIndex(focusable => {
                    return focusable.id === state.activeFocusId;
                });
                for (let index = activeIndex - 1; index >= 0; index--) {
                    const focusable = state.focusables[index];
                    if (focusable?.isActive) {
                        return focusable.id;
                    }
                }
                return undefined;
            }
        });
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    // Determines if TTY is supported on the provided stdin
    isRawModeSupported() {
        return this.props.stdin.isTTY;
    }
    render() {
        return (React.createElement(AppContext.Provider
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        , { 
            // eslint-disable-next-line react/jsx-no-constructed-context-values
            value: {
                exit: this.handleExit
            } },
            React.createElement(StdinContext.Provider
            // eslint-disable-next-line react/jsx-no-constructed-context-values
            , { 
                // eslint-disable-next-line react/jsx-no-constructed-context-values
                value: {
                    stdin: this.props.stdin,
                    setRawMode: this.handleSetRawMode,
                    isRawModeSupported: this.isRawModeSupported(),
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    internal_exitOnCtrlC: this.props.exitOnCtrlC,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    internal_eventEmitter: this.internal_eventEmitter
                } },
                React.createElement(StdoutContext.Provider
                // eslint-disable-next-line react/jsx-no-constructed-context-values
                , { 
                    // eslint-disable-next-line react/jsx-no-constructed-context-values
                    value: {
                        stdout: this.props.stdout,
                        write: this.props.writeToStdout
                    } },
                    React.createElement(StderrContext.Provider
                    // eslint-disable-next-line react/jsx-no-constructed-context-values
                    , { 
                        // eslint-disable-next-line react/jsx-no-constructed-context-values
                        value: {
                            stderr: this.props.stderr,
                            write: this.props.writeToStderr
                        } },
                        React.createElement(FocusContext.Provider
                        // eslint-disable-next-line react/jsx-no-constructed-context-values
                        , { 
                            // eslint-disable-next-line react/jsx-no-constructed-context-values
                            value: {
                                activeId: this.state.activeFocusId,
                                add: this.addFocusable,
                                remove: this.removeFocusable,
                                activate: this.activateFocusable,
                                deactivate: this.deactivateFocusable,
                                enableFocus: this.enableFocus,
                                disableFocus: this.disableFocus,
                                focusNext: this.focusNext,
                                focusPrevious: this.focusPrevious,
                                focus: this.focus
                            } }, this.state.error ? (React.createElement(ErrorOverview, { error: this.state.error })) : (this.props.children)))))));
    }
    componentDidMount() {
        cliCursor.hide(this.props.stdout);
    }
    componentWillUnmount() {
        cliCursor.show(this.props.stdout);
        // ignore calling setRawMode on an handle stdin it cannot be called
        if (this.isRawModeSupported()) {
            this.handleSetRawMode(false);
        }
    }
    componentDidCatch(error) {
        this.handleExit(error);
    }
}
Object.defineProperty(App, "displayName", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'InternalApp'
});
//# sourceMappingURL=App.js.map