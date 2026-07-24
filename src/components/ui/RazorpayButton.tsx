"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface RazorpayButtonProps {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export function RazorpayButton({ amount, currency = "INR", receipt = "receipt_id_1", onSuccess, onError }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Razorpay Script
    const scriptId = "razorpay-checkout-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, receipt })
      });
      
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Test Store",
        description: "Test Transaction",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              toast({ title: "Payment Successful", description: "Your payment was verified." });
              if (onSuccess) onSuccess(response);
            } else {
              throw new Error(verifyData.error || "Signature mismatch");
            }
          } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
            if (onError) onError(err);
          }
        },
        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
        if (onError) onError(response.error);
      });
      rzp1.open();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
      {loading ? "Processing..." : `Pay ₹${(amount / 100).toFixed(2)}`}
    </Button>
  );
}
