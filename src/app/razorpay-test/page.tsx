import { RazorpayButton } from "@/components/ui/RazorpayButton";

export default function RazorpayTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Razorpay Standard Checkout</h1>
        <p className="text-gray-600 mb-8">Test your Razorpay integration below. This will trigger a test payment of ₹5.00.</p>
        
        <RazorpayButton amount={500} currency="INR" receipt="test_rcpt_123" />
      </div>
    </div>
  );
}
