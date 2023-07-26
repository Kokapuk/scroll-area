import { useState } from 'react';
import styles from './App.module.scss';
import ScrollArea from './components/ScrollArea/ScrollArea';

function App() {
  const [contentAmount, setContentAmount] = useState(3);

  return (
    <>
      <div className={styles.modal}>
        <ScrollArea>
          {new Array(contentAmount).fill(0).map((_item, index) => {
            const content = 'Content '.repeat(index + 1);

            return (
              <h1 key={content} className={styles.modal__content}>
                {content}
              </h1>
            );
          })}
        </ScrollArea>
      </div>
      <button onClick={() => setContentAmount((prev) => prev + 1)}>Add</button>
      <button onClick={() => setContentAmount((prev) => prev - 1)}>Remove</button>
    </>
  );
}

export default App;
