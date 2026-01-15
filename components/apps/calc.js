import React, { Component } from 'react';

export class Calculator extends Component {
    constructor() {
        super();
        this.state = {
            displayValue: '0',
            previousValue: null,
            operation: null,
            waitingForOperand: false,
            history: [],
            activeTab: 'general', // general, advance, billsplit, more
            // Bill Split State
            billAmount: '',
            tipPercentage: 0,
            splitCount: 2,
            currency: '₹' // Default Currency
        };
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress = (e) => {
        // Only handle keypress in General/Advance modes
        if (this.state.activeTab !== 'general' && this.state.activeTab !== 'advance') return;

        const key = e.key;
        if (!isNaN(key) || ['+', '-', '*', '/', '=', 'Enter', 'Backspace', 'Escape', '.', '%'].includes(key)) {
            e.preventDefault();
        }

        if (!isNaN(key)) this.inputDigit(parseInt(key));
        else if (key === '.') this.inputDecimal();
        else if (key === '+' || key === '-' || key === '*' || key === '/') {
            const operations = { '+': '+', '-': '-', '*': '×', '/': '÷' };
            this.performOperation(operations[key]);
        } else if (key === 'Enter' || key === '=') this.performOperation('=');
        else if (key === 'Escape') this.clearAll();
        else if (key === 'Backspace') this.clearLastDigit();
        else if (key === '%') this.percentage();
    }

    // --- Calculator Logic ---
    clearAll = () => this.setState({ displayValue: '0', previousValue: null, operation: null, waitingForOperand: false });

    clearLastDigit = () => {
        const { displayValue } = this.state;
        this.setState({ displayValue: displayValue.length > 1 ? displayValue.slice(0, -1) : '0' });
    }

    toggleSign = () => {
        const { displayValue } = this.state;
        this.setState({ displayValue: displayValue.charAt(0) === '-' ? displayValue.slice(1) : '-' + displayValue });
    }

    percentage = () => {
        const val = parseFloat(this.state.displayValue);
        this.setState({ displayValue: String(val / 100) });
    }

    inputDecimal = () => {
        const { displayValue, waitingForOperand } = this.state;
        if (waitingForOperand) this.setState({ displayValue: '0.', waitingForOperand: false });
        else if (displayValue.indexOf('.') === -1) this.setState({ displayValue: displayValue + '.' });
    }

    inputDigit = (digit) => {
        const { displayValue, waitingForOperand } = this.state;
        if (waitingForOperand) this.setState({ displayValue: String(digit), waitingForOperand: false });
        else this.setState({ displayValue: displayValue === '0' ? String(digit) : displayValue + digit });
    }

    performOperation = (nextOperation) => {
        const { displayValue, previousValue, operation } = this.state;
        const inputValue = parseFloat(displayValue);

        if (previousValue == null) {
            this.setState({ previousValue: inputValue });
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = this.calculate(currentValue, inputValue, operation);
            this.setState({ displayValue: String(newValue), previousValue: newValue });
        }
        this.setState({ waitingForOperand: true, operation: nextOperation });
    }

    calculate = (first, second, op) => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '×': return first * second;
            case '÷': return first / second;
            case '=': return second;
            case 'pow': return Math.pow(first, second);
            default: return second;
        }
    }

    scientificOperation = (func) => {
        const value = parseFloat(this.state.displayValue);
        let result = 0;
        switch (func) {
            case 'sin': result = Math.sin(value); break;
            case 'cos': result = Math.cos(value); break;
            case 'tan': result = Math.tan(value); break;
            case 'ln': result = Math.log(value); break;
            case 'log10': result = Math.log10(value); break;
            case 'sqrt': result = Math.sqrt(value); break;
            case 'cbrt': result = Math.cbrt(value); break;
            case 'sq': result = Math.pow(value, 2); break;
            case 'fact': result = this.factorial(value); break;
            case 'pi': result = Math.PI; break;
            case 'e': result = Math.E; break;
            case 'rand': result = Math.random(); break;
            default: return;
        }
        this.setState({ displayValue: String(result), waitingForOperand: true });
    }

    factorial = (n) => {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // --- Components ---

    renderDisplay = () => (
        <div className="flex-none h-40 flex flex-col items-end justify-center px-6 pb-2">
            <div className="text-gray-400 text-sm font-medium mb-1 tracking-widest uppercase">
                {this.state.operation ? `${this.state.previousValue} ${this.state.operation}` : 'Deg'}
            </div>
            <div className="text-gray-900 text-[min(10vh,4rem)] leading-none font-light tracking-tighter break-all text-right w-full">
                {this.state.displayValue}
            </div>
        </div>
    );

    renderKeypad = (mode) => {
        const { operation } = this.state;
        const Button = ({ label, type = 'number', onClick, className = '' }) => {
            let base = "flex items-center justify-center text-xl font-medium transition-all active:scale-90 select-none rounded-[24px] cursor-pointer shadow-sm h-full w-full";
            let look = "bg-white text-gray-700 hover:bg-gray-50"; // Default number

            if (type === 'operator') {
                const active = operation === label && label !== '=';
                look = active ? "bg-blue-600 text-white shadow-md" : "bg-blue-50 text-blue-600 hover:bg-blue-100";
            } else if (type === 'function') {
                look = "bg-gray-100 text-gray-900 hover:bg-gray-200";
            } else if (type === 'scientific') {
                look = "bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 font-normal";
            } else if (type === 'equals') {
                look = "bg-blue-600 text-white shadow-lg hover:bg-blue-700";
            }

            return <div onClick={onClick} className={`${base} ${look} ${className}`}>{label}</div>;
        };

        if (mode === 'general') {
            return (
                <div className="flex-1 grid grid-cols-4 gap-3 p-4">
                    <Button label="AC" type="function" onClick={this.clearAll} />
                    <Button label="()" type="function" onClick={() => { }} />
                    <Button label="%" type="function" onClick={this.percentage} />
                    <Button label="÷" type="operator" onClick={() => this.performOperation('÷')} />

                    <Button label="7" onClick={() => this.inputDigit(7)} />
                    <Button label="8" onClick={() => this.inputDigit(8)} />
                    <Button label="9" onClick={() => this.inputDigit(9)} />
                    <Button label="×" type="operator" onClick={() => this.performOperation('×')} />

                    <Button label="4" onClick={() => this.inputDigit(4)} />
                    <Button label="5" onClick={() => this.inputDigit(5)} />
                    <Button label="6" onClick={() => this.inputDigit(6)} />
                    <Button label="-" type="operator" onClick={() => this.performOperation('-')} />

                    <Button label="1" onClick={() => this.inputDigit(1)} />
                    <Button label="2" onClick={() => this.inputDigit(2)} />
                    <Button label="3" onClick={() => this.inputDigit(3)} />
                    <Button label="+" type="operator" onClick={() => this.performOperation('+')} />

                    <Button label="0" onClick={() => this.inputDigit(0)} />
                    <Button label="." onClick={this.inputDecimal} />
                    <Button label="⌫" onClick={this.clearLastDigit} />
                    <Button label="=" type="equals" onClick={() => this.performOperation('=')} />
                </div>
            );
        } else if (mode === 'advance') {
            return (
                <div className="flex-1 grid grid-cols-5 gap-2 p-3 overflow-y-auto">
                    {/* Scientific Row 1 */}
                    <Button label="2nd" type="scientific" onClick={() => { }} />
                    <Button label="deg" type="scientific" onClick={() => { }} />
                    <Button label="sin" type="scientific" onClick={() => this.scientificOperation('sin')} />
                    <Button label="cos" type="scientific" onClick={() => this.scientificOperation('cos')} />
                    <Button label="tan" type="scientific" onClick={() => this.scientificOperation('tan')} />

                    {/* Scientific Row 2 */}
                    <Button label="xʸ" type="scientific" onClick={() => this.performOperation('pow')} />
                    <Button label="log" type="scientific" onClick={() => this.scientificOperation('log10')} />
                    <Button label="ln" type="scientific" onClick={() => this.scientificOperation('ln')} />
                    <Button label="(" type="scientific" onClick={() => { }} />
                    <Button label=")" type="scientific" onClick={() => { }} />

                    {/* Scientific Row 3 */}
                    <Button label="√" type="scientific" onClick={() => this.scientificOperation('sqrt')} />
                    <Button label="AC" type="function" onClick={this.clearAll} />
                    <Button label="⌫" type="function" onClick={this.clearLastDigit} />
                    <Button label="%" type="function" onClick={this.percentage} />
                    <Button label="÷" type="operator" onClick={() => this.performOperation('÷')} />

                    {/* Scientific Row 4 */}
                    <Button label="x!" type="scientific" onClick={() => this.scientificOperation('fact')} />
                    <Button label="7" onClick={() => this.inputDigit(7)} />
                    <Button label="8" onClick={() => this.inputDigit(8)} />
                    <Button label="9" onClick={() => this.inputDigit(9)} />
                    <Button label="×" type="operator" onClick={() => this.performOperation('×')} />

                    {/* Scientific Row 5 */}
                    <Button label="1/x" type="scientific" onClick={() => { }} />
                    <Button label="4" onClick={() => this.inputDigit(4)} />
                    <Button label="5" onClick={() => this.inputDigit(5)} />
                    <Button label="6" onClick={() => this.inputDigit(6)} />
                    <Button label="-" type="operator" onClick={() => this.performOperation('-')} />

                    {/* Scientific Row 6 */}
                    <Button label="π" type="scientific" onClick={() => this.scientificOperation('pi')} />
                    <Button label="1" onClick={() => this.inputDigit(1)} />
                    <Button label="2" onClick={() => this.inputDigit(2)} />
                    <Button label="3" onClick={() => this.inputDigit(3)} />
                    <Button label="+" type="operator" onClick={() => this.performOperation('+')} />

                    {/* Scientific Row 7 */}
                    <Button label="e" type="scientific" onClick={() => this.scientificOperation('e')} />
                    <Button label="rnd" type="scientific" onClick={() => this.scientificOperation('rand')} />
                    <Button label="0" onClick={() => this.inputDigit(0)} />
                    <Button label="." onClick={this.inputDecimal} />
                    <Button label="=" type="equals" onClick={() => this.performOperation('=')} />
                </div>
            );
        }
    };

    renderBillSplit = () => {
        const currencies = [
            { symbol: '$', name: 'USD ($)' },
            { symbol: '₹', name: 'INR (₹)' },
            { symbol: '€', name: 'EUR (€)' },
            { symbol: '£', name: 'GBP (£)' },
            { symbol: '¥', name: 'JPY (¥)' }
        ];

        return (
            <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto">
                {/* Currency Selector */}
                <div className="flex justify-end">
                    <div className="relative inline-block text-left">
                        <select
                            className="bg-gray-100 text-gray-700 font-medium py-1 px-3 rounded-lg text-sm border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors appearance-none pr-8"
                            value={this.state.currency}
                            onChange={(e) => this.setState({ currency: e.target.value })}
                        >
                            {currencies.map(c => (
                                <option key={c.symbol} value={c.symbol}>{c.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-500 text-sm font-medium">Bill Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-light">{this.state.currency}</span>
                        <input
                            type="number"
                            className="w-full bg-white rounded-2xl p-4 pl-12 text-3xl font-light outline-none text-gray-900 shadow-sm border border-gray-100 focus:border-blue-500 transition-colors"
                            value={this.state.billAmount}
                            onChange={(e) => this.setState({ billAmount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-gray-500 text-sm font-medium">Tips Amount</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[0, 10, 15, 20, 25].map(pct => (
                            <button
                                key={pct}
                                onClick={() => this.setState({ tipPercentage: pct })}
                                className={`py-3 rounded-xl font-medium transition-all ${this.state.tipPercentage === pct ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'}`}
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-gray-500 text-sm font-medium">Split Count: {this.state.splitCount}</label>
                    <input
                        type="range"
                        min="1" max="10"
                        value={this.state.splitCount}
                        onChange={(e) => this.setState({ splitCount: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                <div className="mt-auto bg-blue-50 rounded-2xl p-5 flex justify-between items-center text-blue-900 border border-blue-100">
                    <div>
                        <div className="text-sm opacity-70">Per Person</div>
                        <div className="text-3xl font-bold">
                            {this.state.currency}{this.state.billAmount ? ((parseFloat(this.state.billAmount) * (1 + this.state.tipPercentage / 100)) / this.state.splitCount).toFixed(2) : '0.00'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm opacity-70">Total</div>
                        <div className="text-xl font-semibold">
                            {this.state.currency}{this.state.billAmount ? (parseFloat(this.state.billAmount) * (1 + this.state.tipPercentage / 100)).toFixed(2) : '0.00'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderProTools = () => {
        const ToolItem = ({ icon, label }) => (
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all active:scale-95">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">{icon}</div>
                <div className="font-medium text-gray-700">{label}</div>
            </div>
        );

        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider px-2 mb-2">Math Tools</h3>
                <ToolItem icon="📐" label="Geometry" />
                <ToolItem icon="📉" label="Graphing" />
                <ToolItem icon="⅑" label="Fraction" />

                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider px-2 mt-6 mb-2">Converters</h3>
                <ToolItem icon="💱" label="Currency" />
                <ToolItem icon="📏" label="Length & Distance" />
                <ToolItem icon="⚖️" label="Weight & Mass" />
                <ToolItem icon="🌡️" label="Temperature" />
            </div>
        );
    }

    render() {
        const { activeTab } = this.state;
        const navItems = [
            { id: 'general', label: 'General' },
            { id: 'advance', label: 'Advance' },
            { id: 'billsplit', label: 'Bill Split' },
            { id: 'more', label: 'More' }
        ];

        return (
            <div className="h-full w-full flex flex-col bg-[#fafafa] font-sans overflow-hidden select-none">
                {/* Header/Display Area (Only show display on calc modes) */}
                {(activeTab === 'general' || activeTab === 'advance') && this.renderDisplay()}
                {/* Title for other modes */}
                {(activeTab === 'billsplit' || activeTab === 'more') && (
                    <div className="flex-none h-16 flex items-center px-6">
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {activeTab === 'billsplit' ? 'Split Bill' : 'Pro Tools'}
                        </h1>
                    </div>
                )}

                {/* Main Content Area */}
                {activeTab === 'general' && this.renderKeypad('general')}
                {activeTab === 'advance' && this.renderKeypad('advance')}
                {activeTab === 'billsplit' && this.renderBillSplit()}
                {activeTab === 'more' && this.renderProTools()}

                {/* Bottom Navigation */}
                <div className="flex-none h-16 bg-white border-t border-gray-100 flex justify-evenly items-center px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => this.setState({ activeTab: item.id })}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className={`text-[10px] font-bold tracking-wide uppercase ${activeTab === item.id ? 'opacity-100' : 'opacity-100'}`}>
                                {item.label}
                            </span>
                            {activeTab === item.id && <div className="w-1 h-1 bg-blue-600 rounded-full"></div>}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
}

export default Calculator;

export const displayCalculator = () => {
    return <Calculator />;
}