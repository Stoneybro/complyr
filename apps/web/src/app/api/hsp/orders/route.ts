import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Mock HSP Order Request received:", body);
    } catch (e) {
        console.log("Failed to parse request body");
    }

    return NextResponse.json({
        success: true,
        data: {
            payment_url: "http://localhost:3000/checkout?flow_id=mock_flow_" + Date.now(),
            flow_id: "mock_flow_" + Date.now(),
            cart_mandate_id: "mock_mandate_" + Date.now()
        }
    });
}
