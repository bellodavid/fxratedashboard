"use client";
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

// Base API URL - you can move this to an environment variable
const API_BASE_URL = 'http://localhost:3000';

const CurrencyDashboard = () => {
  const [rates, setRates] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("GHS");
  const [toCurrency, setToCurrency] = useState("NGN");
  const [amount, setAmount] = useState("1");
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forex-rates`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Enable CORS
        credentials: 'include', // Include credentials if your API requires them
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  const updateRate = async (source, currency) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-rate`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ source, currency }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchRates();
    } catch (error) {
      console.error("Error updating rate:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = async () => {
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


  // Rest of the component remains the same
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Currency Converter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Currency Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rates[0]?.rates &&
                    Object.keys(rates[0].rates).map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        <span className="mr-2">{getFlag(currency)}</span>
                        {currency}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rates[0]?.rates &&
                    Object.keys(rates[0].rates).map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        <span className="mr-2">{getFlag(currency)}</span>
                        {currency}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={convertCurrency}>Convert</Button>
          </div>
          {convertedAmount && (
            <div className="mt-4 text-lg font-semibold">
              {amount} {fromCurrency} = {convertedAmount} {toCurrency}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates Table Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Exchange Rates</span>
            <Button onClick={fetchRates} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Currency</th>
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
                  <th className="px-4 py-2"></th>
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
                {rates[0]?.rates &&
                  Object.entries(rates[0].rates).map(([currency]) => (
                    <tr key={currency} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span>{getFlag(currency)}</span>
                          <span>{currency}</span>
                        </div>
                      </td>
                      {rates.map((source) => (
                        <React.Fragment key={source.source}>
                          <td className="px-4 py-2 text-center">
                            {source.rates[currency]?.buyRate.toFixed(4)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {source.rates[currency]?.sellRate.toFixed(4)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="px-4 py-2 text-center">
                        <Button
                          onClick={() => updateRate(rates[0].source, currency)}
                          variant="outline"
                          size="sm"
                          disabled={loading}
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              loading ? "animate-spin" : ""
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