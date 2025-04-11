'use client';

import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { useStateChangeTracker } from '@/lib/hook';
const topic = 'r2s';
const mqttConfig = {
  hostname: 'devapi.uniscore.vn',
  port: 443,
  protocol: 'wss',
  username: 'football',
  password: 'football123',
  path: '/mqtt',
};
interface Message {
  text: string;
  sender: string;
}


function Counter() {
  // const [countState, setCountState] = useState(0);
  const countRef = useRef(0);
  const { style, renderCount } = useStateChangeTracker([countRef.current], 800);
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");


  useEffect(() => {
    const url = `${mqttConfig.protocol}://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`;
    const options = {
      username: mqttConfig.username,
      password: mqttConfig.password,
      reconnectPeriod: 1000,
    };

    const newClient = mqtt.connect(url, options);

    newClient.on('connect', () => {
      console.log('✅ Kết nối MQTT thành công');
      newClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(` Đã subscribe topic: ${topic}`);
        }
      });
    });

    newClient.on('message', (receivedTopic, payload) => {
      if (receivedTopic === topic) {
        setMessages((prev) => [...prev, { text: payload.toString(), sender: "mqtt" }]);
        if (payload.toString()) {
          // setCountState(prev => prev + 1);
          // console.log(`countState ${countState}`);
          // console.log(`countRef ${countRef.current}`);
          countRef.current = countRef.current + 1;
          
        }
      }
    });

    setClient(newClient);

    return () => {
      if (newClient) {
        newClient.end();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputText.trim() === "" || !client) return;
    const messageText = inputText;
    client.publish(topic, messageText);
    console.log(` Gửi tin nhắn: ${messageText}`);
    setMessages((prev) => [...prev, { text: messageText, sender: "user" }]);
    setInputText("");
};


  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} className="flex flex-col items-center justify-center">
      {/* <p>Count (useState): {countState}</p> */}
      <p>Count (useRef): {countRef.current}</p>
      <p><span className="font-medium">State-driven renders:</span> {renderCount}</p>
      <div className="fixed bottom-24 right-4 z-50">
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
        </div>
    </div>
  );
}

export default Counter;