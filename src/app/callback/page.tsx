'use client';

import React, { useState, useCallback,useRef} from 'react';
import { useStateChangeTracker } from '@/lib/hook';

interface ChildComponentProps {
  onClick: () => void;
}

function ChildComponent({ onClick }: ChildComponentProps) {

  const { style,renderCount } = useStateChangeTracker([onClick], 800);
  console.log('ChildComponent re-render');
  return (
  <div>
    <p><span className="font-medium">ChildComponent renders:</span> {renderCount}</p>
    <button onClick={onClick}>Click me</button>
  </div>
  );
}

const MemoizedChildComponent = React.memo(ChildComponent);

function ParentComponent() {
  const [count, setCount] = useState(0);
  const { style, renderCount } = useStateChangeTracker([count], 800);
  
  
  // Hàm callback không sử dụng useCallback
  // const handleClickWithoutCallback = () => {
  //   console.log('Clicked without useCallback');
  //   setCount(count + 1);
  // };

  // Hàm callback sử dụng useCallback
  const handleClickWithCallback = useCallback(() => {
    console.log('Clicked with useCallback');
    setCount(count + 1);
  }, [count]);

  

  return (
    <div className='layout relative flex min-h-screen flex-col items-center justify-center py-12 text-center'>
      <p>Count: {count}</p>
      {/* <MemoizedChildComponent onClick={handleClickWithoutCallback} /> */}
      <MemoizedChildComponent onClick={handleClickWithCallback} />
      <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
          <p><span className="font-medium">State-driven renders:</span> {renderCount}</p>
        </div>
    </div>
  );
}

export default ParentComponent;