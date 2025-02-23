"use client"

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_BASE_URL = 'http://localhost:3000';

const CurrencyDashboard = () => {
  const [rates, setRates] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("AED");
  const [amount, setAmount] = useState("1");
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState({});

  // Function to parse currency from different formats
  const parseCurrencyPair = (pair, source) => {
    if (source === "CurrencyLayer" && pair.length === 6) {
      return {
        base: pair.slice(0, 3),
        target: pair.slice(3)
      };
    }
    return {
      base: "USD",
      target: pair
    };
  };

  // Function to get rate data considering different source formats
  const getRateData = (source, currency) => {
    if (source.source === "CurrencyLayer") {
      const pair = `USD${currency}`;
      return source.rates[pair];
    }
    return source.rates[currency];
  };

  // Function to get all available currencies
  const getAvailableCurrencies = () => {
    if (!rates.length) return [];
    
    const currencies = new Set();
    rates.forEach(source => {
      Object.keys(source.rates).forEach(key => {
        const { target } = parseCurrencyPair(key, source.source);
        currencies.add(target);
      });
    });
    return Array.from(currencies);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forex-rates`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRate = async (source, currency) => {
    setUpdateLoading(prev => ({ ...prev, [currency]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-rate`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ 
          source, 
          currency: source === "CurrencyLayer" ? `USD${currency}` : currency
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchRates();
    } catch (error) {
      console.error("Error updating rate:", error);
    } finally {
      setUpdateLoading(prev => ({ ...prev, [currency]: false }));
    }
  };

  const convertCurrency = async () => {
    if (!amount || !fromCurrency || !toCurrency) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/consolidated-rate?from=${fromCurrency}&to=${toCurrency}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const result = parseFloat(amount) * data.rate;
      setConvertedAmount(result.toFixed(2));
    } catch (error) {
      console.error("Error converting currency:", error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Get all available currencies for dropdowns
  const currencies = getAvailableCurrencies();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Currency Converter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Converter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {getFlag(currency)} {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const temp = fromCurrency;
                    setFromCurrency(toCurrency);
                    setToCurrency(temp);
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {getFlag(currency)} {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Amount"
                  className="flex-1"
                />
                <Button onClick={convertCurrency}>Convert</Button>
              </div>
            </div>
            {convertedAmount && (
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <p className="text-lg">
                  {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rates Table Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Exchange Rates</span>
            <Button 
              onClick={fetchRates} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-20">
                <tr className="border-b">
                  <th className="sticky left-0 bg-white px-4 py-2 text-left z-30">Currency</th>
                  {rates.map((source) => (
                    <React.Fragment key={source.source}>
                      <th className="px-4 py-2 text-center" colSpan={2}>
                        {source.source}
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
                <tr className="border-b">
                  <th className="sticky left-0 bg-white px-4 py-2 z-30"></th>
                  {rates.map((source) => (
                    <React.Fragment key={source.source}>
                      <th className="px-4 py-2 text-center">Buy</th>
                      <th className="px-4 py-2 text-center">Sell</th>
                    </React.Fragment>
                  ))}
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency) => (
                  <tr key={currency} className="border-b hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-2 z-10">
                      <div className="flex items-center gap-2">
                        <span>{getFlag(currency)}</span>
                        <span>{currency}</span>
                      </div>
                    </td>
                    {rates.map((source) => {
                      const rateData = getRateData(source, currency);
                      return (
                        <React.Fragment key={source.source}>
                          <td className="px-4 py-2 text-center">
                            {rateData?.buyRate.toFixed(4)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {rateData?.sellRate.toFixed(4)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-4 py-2 text-center">
                      <Button
                        onClick={() => updateRate(rates[0].source, currency)}
                        variant="outline"
                        size="sm"
                        disabled={updateLoading[currency]}
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            updateLoading[currency] ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get flag emoji
const getFlag = (countryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

export default CurrencyDashboard;