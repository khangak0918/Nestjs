import React, { useState, useEffect } from 'react';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Cập nhật thời gian hiện tại mỗi giây (tùy chọn)
    const intervalId = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    // Hủy interval khi component unmount
    return () => clearInterval(intervalId);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const day = currentDate.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

  const days = [];
  // Thêm các ngày của tháng trước vào đầu nếu cần để căn chỉnh
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  // Thêm các ngày của tháng hiện tại
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === day && month === currentDate.getMonth() && year === currentDate.getFullYear();
    days.push(
      <div
        key={i}
        className={`p-2 text-center ${
          isToday ? 'bg-blue-500 text-white rounded-full' : 'text-gray-300'
        }`}
      >
        {i}
      </div>
    );
  }

  // Thêm các ngày của tháng sau vào cuối nếu cần để đủ số ô
  const remainingDays = 42 - firstDayOfWeek - daysInMonth;
  for (let i = 0; i < remainingDays; i++) {
    days.push(<div key={`empty-end-${i}`} className="p-2"></div>);
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-gray-900 text-white rounded-md shadow-lg p-4 w-72">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">{monthNames[month]} {year}</h2>
        
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center text-sm text-gray-400">
            {dayName}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => day)}
      </div>
    </div>
  );
}

export default Calendar;