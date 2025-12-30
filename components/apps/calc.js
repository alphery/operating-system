import React, { Component } from 'react';

export class Calculator extends Component {
    constructor() {
        super();
        this.state = {
            displayValue: '0',
            previousValue: null,
            operation: null,
            waitingForOperand: false,
            history: [] // Keeping history internal for now
        };
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress = (e) => {
        const key = e.key;

        // Prevent default actions for calculator keys
        if (!isNaN(key) || ['+', '-', '*', '/', '=', 'Enter', 'Backspace', 'Escape', '.', '%'].includes(key)) {
            e.preventDefault();
        }

        if (!isNaN(key)) {
            this.inputDigit(parseInt(key));
        } else if (key === '.') {
            this.inputDecimal();
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            const operations = { '+': '+', '-': '-', '*': '×', '/': '÷' };
            this.performOperation(operations[key]);
        } else if (key === 'Enter' || key === '=') {
            this.performOperation('=');
        } else if (key === 'Escape') {
            this.clearAll();
        } else if (key === 'Backspace') {
            this.clearLastDigit();
        } else if (key === '%') {
            this.percentage();
        }
    }

    clearAll = () => {
        this.setState({
            displayValue: '0',
            previousValue: null,
            operation: null,
            waitingForOperand: false
        });
    }

    clearLastDigit = () => {
        const { displayValue } = this.state;
        this.setState({
            displayValue: displayValue.length > 1 ? displayValue.slice(0, -1) : '0'
        });
    }

    toggleSign = () => {
        const { displayValue } = this.state;
        this.setState({
            displayValue: displayValue.charAt(0) === '-' ? displayValue.slice(1) : '-' + displayValue
        });
    }

    percentage = () => {
        const { displayValue } = this.state;
        const value = parseFloat(displayValue);
        this.setState({
            displayValue: String(value / 100)
        });
    }

    inputDecimal = () => {
        const { displayValue, waitingForOperand } = this.state;
        if (waitingForOperand) {
            this.setState({
                displayValue: '0.',
                waitingForOperand: false
            });
        } else if (displayValue.indexOf('.') === -1) {
            this.setState({
                displayValue: displayValue + '.'
            });
        }
    }

    inputDigit = (digit) => {
        const { displayValue, waitingForOperand } = this.state;
        if (waitingForOperand) {
            this.setState({
                displayValue: String(digit),
                waitingForOperand: false
            });
        } else {
            this.setState({
                displayValue: displayValue === '0' ? String(digit) : displayValue + digit
            });
        }
    }

    performOperation = (nextOperation) => {
        const { displayValue, previousValue, operation } = this.state;
        const inputValue = parseFloat(displayValue);

        if (previousValue == null) {
            this.setState({
                previousValue: inputValue
            });
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = this.calculate(currentValue, inputValue, operation);
            this.setState({
                displayValue: String(newValue),
                previousValue: newValue
            });
        }

        this.setState({
            waitingForOperand: true,
            operation: nextOperation
        });
    }

    calculate = (firstValue, secondValue, operation) => {
        switch (operation) {
            case '+': return firstValue + secondValue;
            case '-': return firstValue - secondValue;
            case '×': return firstValue * secondValue;
            case '÷': return firstValue / secondValue;
            case '=': return secondValue;
            default: return secondValue;
        }
    }

    render() {
        const { displayValue, operation } = this.state;

        // Button Component for cleaner render
        const Button = ({ label, type = 'number', onClick, double = false }) => {
            let baseClasses = "flex items-center justify-center text-2xl font-light transition-all active:scale-95 select-none h-full w-full border-[0.5px] border-gray-800";
            let colorClasses = "";

            if (type === 'number') {
                colorClasses = "bg-gray-700 hover:bg-gray-600 text-white";
            } else if (type === 'operator') {
                // Highlight active operator
                const isActive = operation === label;
                colorClasses = isActive
                    ? "bg-white text-orange-500 font-bold"
                    : "bg-orange-500 hover:bg-orange-400 text-white font-medium";
            } else if (type === 'function') {
                colorClasses = "bg-gray-500 hover:bg-gray-400 text-black font-medium";
            }

            return (
                <div onClick={onClick} className={`${baseClasses} ${colorClasses} ${double ? 'col-span-2' : ''}`}>
                    {label}
                </div>
            );
        };

        return (
            <div className="h-full w-full flex flex-col bg-gray-900 select-none">
                {/* Display Area */}
                <div className="flex-1 bg-black flex items-end justify-end p-6 pb-2 min-h-[30%]">
                    <div className="text-white text-7xl font-thin tracking-tight break-all text-right w-full">
                        {displayValue}
                    </div>
                </div>

                {/* Keypad Area */}
                <div className="flex-[2] grid grid-cols-4 grid-rows-5 bg-gray-900">
                    {/* Row 1 */}
                    <Button label={displayValue === '0' ? 'AC' : 'C'} type="function" onClick={this.clearAll} />
                    <Button label="±" type="function" onClick={this.toggleSign} />
                    <Button label="%" type="function" onClick={this.percentage} />
                    <Button label="÷" type="operator" onClick={() => this.performOperation('÷')} />

                    {/* Row 2 */}
                    <Button label="7" type="number" onClick={() => this.inputDigit(7)} />
                    <Button label="8" type="number" onClick={() => this.inputDigit(8)} />
                    <Button label="9" type="number" onClick={() => this.inputDigit(9)} />
                    <Button label="×" type="operator" onClick={() => this.performOperation('×')} />

                    {/* Row 3 */}
                    <Button label="4" type="number" onClick={() => this.inputDigit(4)} />
                    <Button label="5" type="number" onClick={() => this.inputDigit(5)} />
                    <Button label="6" type="number" onClick={() => this.inputDigit(6)} />
                    <Button label="-" type="operator" onClick={() => this.performOperation('-')} />

                    {/* Row 4 */}
                    <Button label="1" type="number" onClick={() => this.inputDigit(1)} />
                    <Button label="2" type="number" onClick={() => this.inputDigit(2)} />
                    <Button label="3" type="number" onClick={() => this.inputDigit(3)} />
                    <Button label="+" type="operator" onClick={() => this.performOperation('+')} />

                    {/* Row 5 */}
                    <Button label="0" type="number" double onClick={() => this.inputDigit(0)} />
                    <Button label="." type="number" onClick={this.inputDecimal} />
                    <Button label="=" type="operator" onClick={() => this.performOperation('=')} />
                </div>
            </div>
        );
    }
}

export default Calculator;

export const displayCalculator = () => {
    return <Calculator />;
}