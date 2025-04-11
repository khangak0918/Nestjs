'use client';

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
 
export function HomePage() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
 
  useEffect(() => {
    // MQTT connection configuration
    const topic = 'r2s';
    const mqttConfig = {
      hostname: 'devapi.uniscore.vn',
      port: 443,
      protocol: 'wss',
      username: 'football',
      password: 'football123',
      path: '/mqtt',
    };
    const mqttClient = mqtt.connect(`wss://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`, {
      username: mqttConfig.username,
      password: mqttConfig.password,
    });
    console.log(mqttClient)
 
    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      // Subscribe to the r2s topic
      mqttClient.subscribe(topic, (err) => {
        if (err) console.error('Subscribe error:', err);
        else console.log('Subscribed to r2s topic');
      });
    });
 
    // Handle incoming messages
    mqttClient.on('message', (topic, payload) => {
      console.log('Received message:', payload.toString());
      setMessages(prev => [...prev, payload.toString()]);
    });
 
    // Handle errors
    mqttClient.on('error', (err) => {
      console.error('MQTT error:', err);
    });
 
    setClient(mqttClient);
 
    // Cleanup on component unmount
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);
 
  return (
    <div>
      <h1>MQTT Messages</h1>
      <div>
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
      <button onClick={() => {
        client?.publish('r2s', 'test');
      }}>Publish msg</button>
    </div>
  );
}
 
export default HomePage;