'use client';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Calendar from './calendar';
import mqtt from 'mqtt';

interface SportEventDtoWithStat {
  id: string;
  startTimestamp: number;
  tournament: {
    id: string;
    priority: number;
    name: string;
    slug: string;
    group_num: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    primary_color: string;
    secondary_color: string;
  };
  status: string | number;
  homeTeam: {
    id: string;
    name: string;
    slug: string;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
  };
  stage_id: string;
  time?: {
    status: string | number;
    currentPeriodStartTimestamp: number;
  };
  homeScore: {
    display: number;
    period1: number;
    period2: number;
  };
  awayScore: {
    display: number;
    period1: number;
    period2: number;
  };
  slug: string;
  roundInfo: {
    round: number;
  };
  winnerCode: number;
  lineup: number;
  homeRedCards: number;
  awayRedCards: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeCornerKicks: number;
  awayCornerKicks: number;
  season_id: string;
  is_id: string;
}

interface ApiResponse {
  code: number;
  data: {
    events: string;
    detail: string;
  };
  message: string;
}

const getSlug = (name: string): string => {
  return name.toLowerCase().replace(/ /g, '-');
};

const convertStatusCode = (code: number): string | number => {
  switch (code) {
    case 0:
      return 'Not Started';
    case 1:
      return 'Live';
    case 2:
      return 'Finished';
    default:
      return code;
  }
};

const parseMatchDataArray = (
  matchDataString: string | null | undefined
): SportEventDtoWithStat[] => {
  if (typeof matchDataString !== 'string' || matchDataString.length <= 0) {
    return [];
  }
  const matchDataArray = matchDataString.split('!!');
  const matches = matchDataArray.map((matchString) => {
    const matchDetails = matchString.split('^');
    const time =
      Number(matchDetails[17]) === -1
        ? undefined
        : {
            status: convertStatusCode(Number(matchDetails[9])),
            currentPeriodStartTimestamp: Number(matchDetails[17]),
          };

    return {
      id: matchDetails[0],
      startTimestamp: Number(matchDetails[1]),
      tournament: {
        id: matchDetails[2],
        priority: Number(matchDetails[3]),
        name: matchDetails[4],
        slug: matchDetails[5],
        group_num: Number(matchDetails[6]),
        category: {
          id: matchDetails[7],
          name: matchDetails[8],
          slug: getSlug(matchDetails[8]),
        },
        primary_color: matchDetails[36] || '',
        secondary_color: matchDetails[37] || '',
      },
      status: convertStatusCode(Number(matchDetails[9])),
      homeTeam: {
        id: matchDetails[10],
        name: matchDetails[11],
        slug: matchDetails[12],
      },
      awayTeam: {
        id: matchDetails[13],
        name: matchDetails[14],
        slug: matchDetails[15],
      },
      stage_id: matchDetails[16],
      time,
      homeScore: {
        display: Number(matchDetails[18]),
        period1: Number(matchDetails[19]),
        period2: Number(matchDetails[20]),
      },
      awayScore: {
        display: Number(matchDetails[21]),
        period1: Number(matchDetails[22]),
        period2: Number(matchDetails[23]),
      },
      slug: matchDetails[24],
      roundInfo: {
        round: Number(matchDetails[25]),
      },
      winnerCode: Number(matchDetails[26]),
      lineup: Number(matchDetails[27]),
      homeRedCards: Number(matchDetails[28]),
      awayRedCards: Number(matchDetails[29]),
      homeYellowCards: Number(matchDetails[30]),
      awayYellowCards: Number(matchDetails[31]),
      homeCornerKicks: Number(matchDetails[32]),
      awayCornerKicks: Number(matchDetails[33]),
      season_id: matchDetails[34],
      is_id: matchDetails[35],
    } as SportEventDtoWithStat;
  });
  return matches;
};

export const fetchLiveFootballEvents = async (): Promise<SportEventDtoWithStat[]> => {
  try {
    const response = await axios.get<ApiResponse>(
      'https://api.uniscore.com/api/v1/sport/football/events/live'
    );

    if (response.data && response.data.data && response.data.data.events) {
      return parseMatchDataArray(response.data.data.events);
    } else {
      console.error('Invalid API response format:', response.data);
      return [];
    }
  } catch (error: any) {
    console.error('Error fetching live football events:', error.message);
    return [];
  }
};

const convertTimestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

function MatchPage() {
  const [matches, setMatches] = useState<SportEventDtoWithStat[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [homeResult, setHomeResult] = useState<string>('');
  const [awayResult, setAwayResult] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  const mqttTopicPrefix = 'football/match/'; // Topic prefix cho kết quả trận đấu

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchLiveFootballEvents();
      setMatches(data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    // MQTT connection configuration
    const mqttConfig = {
      hostname: 'devapi.uniscore.vn',
      port: 443,
      protocol: 'wss',
      username: 'football',
      password: 'football123',
      path: '/mqtt',
    };

    const mqttClient = mqtt.connect(
      `wss://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`,
      {
        username: mqttConfig.username,
        password: mqttConfig.password,
      }
    );

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker for results');
      setClient(mqttClient);
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const openResultModal = (matchId: string) => {
    setSelectedMatchId(matchId);
    setIsModalOpen(true);
    setHomeResult('');
    setAwayResult('');
  };

  const closeResultModal = () => {
    setIsModalOpen(false);
    setSelectedMatchId(null);
    setHomeResult('');
    setAwayResult('');
  };

  const publishResult = () => {
    if (client && selectedMatchId) {
      const topic = `${mqttTopicPrefix}${selectedMatchId}/result`;
      const message = JSON.stringify({
        home: homeResult,
        away: awayResult,
        updatedAt: new Date().toISOString(),
      });
      client.publish(topic, message, (error) => {
        if (error) {
          console.error('Error publishing result:', error);
        } else {
          console.log(`Published result for match ${selectedMatchId} to topic: ${topic}`, message);
          closeResultModal();
          // Optionally, bạn có thể cập nhật state matches ở đây nếu cần hiển thị kết quả ngay lập tức
          setMatches(prevMatches =>
            prevMatches.map(match =>
              match.id === selectedMatchId
                ? {
                    ...match,
                    homeScore: { ...match.homeScore, display: parseInt(homeResult, 10) || 0 },
                    awayScore: { ...match.awayScore, display: parseInt(awayResult, 10) || 0 },
                  }
                : match
            )
          );
        }
      });
    } else {
      console.error('MQTT client not connected or no match selected.');
    }
  };

  return (
    <div className="layout relative flex max-w-screen-2xl min-h-screen flex-col items-center py-12 text-center">
      <div className="absolute top-14 left-2 z-10">
        <Calendar />
      </div>
      <h1 className="text-2xl font-bold mb-4">Live Football Matches</h1>
      <ul className="space-y-4">
        {matches.map((match) => {
          const startTime = convertTimestampToDate(match.startTimestamp);
          return (
            <li
              key={match.id}
              className="border p-4 rounded shadow-md cursor-pointer hover:shadow-lg"
              onClick={() => openResultModal(match.id)}
            >
              <p>{`Id: ${match.id}`}</p>
              <h2 className="text-xl font-semibold">{`${match.homeTeam.name} vs ${match.awayTeam.name}`}</h2>
              <p>{`Tournament: ${match.tournament.name}`}</p>
              <p>{`Status: ${match.status}`}</p>
              <p>{`Score: ${match.homeScore.display} - ${match.awayScore.display}`}</p>
              <p>{`Start Date: ${formatDate(startTime)}`}</p>
              <p>{`Start Time: ${formatTime(startTime)}`}</p>
            </li>
          );
        })}
      </ul>

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">Enter Result for Match ID: {selectedMatchId}</h2>
            <div className="mb-4">
              <label htmlFor="homeResult" className="block text-gray-700 text-sm font-bold mb-2">
                {matches.find((m) => m.id === selectedMatchId)?.homeTeam.name}:
              </label>
              <input
                type="number"
                id="homeResult"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={homeResult}
                onChange={(e) => setHomeResult(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="awayResult" className="block text-gray-700 text-sm font-bold mb-2">
                {matches.find((m) => m.id === selectedMatchId)?.awayTeam.name}:
              </label>
              <input
                type="number"
                id="awayResult"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={awayResult}
                onChange={(e) => setAwayResult(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                onClick={closeResultModal}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={publishResult}
              >
                Publish Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchPage;