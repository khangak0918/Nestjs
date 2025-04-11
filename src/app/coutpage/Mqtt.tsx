import React, { useEffect, useState } from "react";
import mqtt from "mqtt";

const topic = "r2s";
const mqttConfig = {
    hostname: "devapi.uniscore.vn",
    port: 443,
    protocol: "wss",
    username: "football",
    password: "football123",
    path: "/mqtt",
};

const MqttClient = React.memo(() => { // Sử dụng React.memo
    interface Message {
        text: string;
        sender: string;
    }

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [client, setClient] = useState<mqtt.MqttClient | null>(null); // Thêm state client
    console.log("msg",messages)

    useEffect(() => {
        const url = `${mqttConfig.protocol}://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`;
        const options = {
            username: mqttConfig.username,
            password: mqttConfig.password,
            reconnectPeriod: 1000,
        };

        const newClient = mqtt.connect(url, options); // Tạo client mới

        newClient.on("connect", () => {
            console.log("✅ Kết nối MQTT thành công");
            newClient.subscribe(topic, (err) => {
                if (!err) {
                    console.log(` Đã subscribe topic: ${topic}`);
                }
            });
        });

        newClient.on("message", (receivedTopic, payload) => {
            if (receivedTopic === topic) {
                console.log(` Nhận tin nhắn: ${payload.toString()}`);
                setMessages((prev) => [...prev, { text: payload.toString(), sender: "mqtt" }]);
            }
        });

        setClient(newClient); // Lưu client vào state

        return () => {
            if (newClient) {
                newClient.end(); // Ngắt kết nối khi component unmount
            }
        };
    }, []); // Thêm dependency array rỗng

    const sendMessage = () => {
        if (inputText.trim() === "" || !client) return;
        const messageText = inputText;
        client.publish(topic, messageText);
        console.log(` Gửi tin nhắn: ${messageText}`);
        setMessages((prev) => [...prev, { text: messageText, sender: "user" }]);
        setInputText("");
    };

    return (
        <div className="max-w-md mx-auto bg-gray-100 shadow-lg rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4"> MQTT Chat</h2>
            <div className="h-64 overflow-y-auto p-2 bg-white rounded-lg shadow-inner">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`px-4 py-2 rounded-lg max-w-xs text-white ${msg.sender === "user" ? "bg-blue-500" : "bg-gray-500"
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-grow border rounded-lg p-2 mr-2"
                />
                <button
                    onClick={sendMessage}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                >
                    Gửi
                </button>
            </div>
        </div>
    );
});

export default MqttClient;