import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const vapiPrivateKey = process.env.VAPI_PRIVATE_KEY;
const ngrokUrl = process.argv[2]; // Passed as argument

if (!vapiPrivateKey) {
    console.error('❌ VAPI_PRIVATE_KEY missing in .env.local');
    process.exit(1);
}

if (!ngrokUrl) {
    console.error('❌ Please provide your ngrok URL as an argument (e.g. tsx scripts/setup-vapi-assistant.ts https://xyz.ngrok-free.app)');
    process.exit(1);
}

const tools = [
    {
        async: false,
        function: {
            description: "Gets the user's current subscription plan, status, points balance, and recent payment history. Use this at the start of the call or when they ask about their account.",
            name: "get_user_context",
            parameters: {
                properties: {
                    userId: { description: "The unique ID of the user from Clerk.", type: "string" }
                },
                required: ["userId"],
                type: "object"
            }
        },
        messages: [
            { content: "Dạ đợi em một xíu để em kiểm tra thông tin tài khoản của mình trên hệ thống nhé...", type: "request-start" },
            { content: "Dạ em đã thấy thông tin rồi ạ.", type: "request-complete" }
        ],
        server: { url: `${ngrokUrl}/api/voice/tools` },
        type: "function"
    },
    {
        async: false,
        function: {
            description: "Forcefully fixes the user's subscription status and plan. Use this if the user says they paid but are still on the free plan or their status is inactive. It will upgrade them to Medical Beta and set them to ACTIVE.",
            name: "sync_subscription",
            parameters: {
                properties: {
                    userId: { description: "The unique ID of the user.", type: "string" }
                },
                required: ["userId"],
                type: "object"
            }
        },
        messages: [
            { content: "Dạ em đang tiến hành cập nhật lại gói cước Medical Beta cho mình ngay đây ạ...", type: "request-start" },
            { content: "Dạ xong rồi ạ, gói cước của mình đã được kích hoạt thành công.", type: "request-complete" }
        ],
        server: { url: `${ngrokUrl}/api/voice/tools` },
        type: "function"
    },
    {
        async: false,
        function: {
            description: "Creates a support ticket for a human admin to review. Use this if the user is angry, requests a refund, or has a problem you cannot solve with other tools.",
            name: "create_ticket",
            parameters: {
                properties: {
                    description: { description: "A detailed summary of the user's problem.", type: "string" },
                    priority: { enum: ["low", "medium", "high", "urgent"], type: "string" },
                    subject: { description: "A short subject line for the ticket.", type: "string" },
                    transcript: { description: "The transcript context provided by the voice engine.", type: "string" },
                    userId: { description: "The unique ID of the user.", type: "string" }
                },
                required: ["userId", "description"],
                type: "object"
            }
        },
        messages: [
            { content: "Dạ vấn đề này em sẽ tạo một phiếu hỗ trợ để các anh kỹ thuật xử lý gấp cho mình nhé...", type: "request-start" },
            { content: "Dạ em đã gửi yêu cầu hỗ trợ rồi ạ. Các anh admin sẽ phản hồi mình sớm nhất có thể.", type: "request-complete" }
        ],
        server: { url: `${ngrokUrl}/api/voice/tools` },
        type: "function"
    }
];

async function setup() {
    console.log('--- Step 1: Registering Tools ---');
    const toolIds = [];
    for (const tool of tools) {
        const res = await fetch('https://api.vapi.ai/tool', {
            body: JSON.stringify(tool),
            headers: {
                'Authorization': `Bearer ${vapiPrivateKey}`,
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
        const data: any = await res.json();
        if (res.ok) {
            console.log(`✅ Tool ${tool.function.name} registered: ${data.id}`);
            toolIds.push(data.id);
        } else {
            console.error(`❌ Failed to register ${tool.function.name}:`, JSON.stringify(data, null, 2));
        }
    }

    console.log('\n--- Step 2: Creating Assistant ---');
    const assistant = {
        firstMessage: "Dạ em chào anh/chị, em là nhân viên hỗ trợ tự động của Phở Platform. Em có thể giúp gì được cho mình ạ?",
        model: {
            messages: [
                {
                    content: "Bạn là nhân viên hỗ trợ khách hàng của Phở Platform (Phở Chat & Phở Studio). Nhiệm vụ của bạn là giải đáp thắc mắc và giúp khách hàng xử lý các vấn đề về tài khoản, gói cước. Bạn có giọng điệu thân thiện (gọi khách là anh/chị, xưng em), chuyên nghiệp và luôn sẵn lòng giúp đỡ. \n\nQUY TRÌNH XỬ LÝ:\n1. Chào hỏi và dùng tool get_user_context để xem thông tin user (hãy dùng userId được truyền vào biến).\n2. Nếu khách hàng báo đã nạp tiền nhưng chưa có gói: Kiểm tra lịch sử giao dịch. Nếu kẹt, dùng sync_subscription để kích hoạt gói ngay lập tức.\n3. Nếu khách hàng không hài lòng hoặc đòi hoàn tiền: Dùng create_ticket để chuyển cho admin.\n4. Tránh lặp lại câu từ máy móc, hãy nói chuyện như người thật.",
                    role: "system"
                }
            ],
            model: "gpt-4o",
            provider: "openai",
            toolIds: toolIds
        },
        name: "Phở Platform Support Agent",
        transcriber: {
            language: "vi",
            model: "nova-2",
            provider: "deepgram"
        },
        voice: {
            provider: "openai",
            voiceId: "alloy"
        }
    };

    const res = await fetch('https://api.vapi.ai/assistant', {
        body: JSON.stringify(assistant),
        headers: {
            'Authorization': `Bearer ${vapiPrivateKey}`,
            'Content-Type': 'application/json'
        },
        method: 'POST'
    });
    const data: any = await res.json();
    if (res.ok) {
        console.log(`\n🚀 Assistant created! ID: ${data.id}`);
        console.log('----------------------------------------------------');
        console.log(`👉 Add this to .env.local: NEXT_PUBLIC_VAPI_ASSISTANT_ID=${data.id}`);
        console.log('----------------------------------------------------');
    } else {
        console.error('❌ Failed to create assistant:', JSON.stringify(data, null, 2));
    }
}

setup();
