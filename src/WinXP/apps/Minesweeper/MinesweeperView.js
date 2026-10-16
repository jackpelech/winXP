import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { WindowDropDowns } from 'components';
import dropDownData from './dropDownData';
import dead from 'assets/minesweeper/dead.png';
import smile from 'assets/minesweeper/smile.png';
import win from 'assets/minesweeper/win.png';
import ohh from 'assets/minesweeper/ohh.png';
import empty from 'assets/empty.png';
import open1 from 'assets/minesweeper/open1.png';
import open2 from 'assets/minesweeper/open2.png';
import open3 from 'assets/minesweeper/open3.png';
import open4 from 'assets/minesweeper/open4.png';
import open5 from 'assets/minesweeper/open5.png';
import open6 from 'assets/minesweeper/open6.png';
import open7 from 'assets/minesweeper/open7.png';
import open8 from 'assets/minesweeper/open8.png';
import flag from 'assets/minesweeper/flag.png';
import mine from 'assets/minesweeper/mine-ceil.png';
import mineDeath from 'assets/minesweeper/mine-death.png';
import misFlagged from 'assets/minesweeper/misflagged.png';
import question from 'assets/minesweeper/question.png';
import digit0 from 'assets/minesweeper/digit0.png';
import digit1 from 'assets/minesweeper/digit1.png';
import digit2 from 'assets/minesweeper/digit2.png';
import digit3 from 'assets/minesweeper/digit3.png';
import digit4 from 'assets/minesweeper/digit4.png';
import digit5 from 'assets/minesweeper/digit5.png';
import digit6 from 'assets/minesweeper/digit6.png';
import digit7 from 'assets/minesweeper/digit7.png';
import digit8 from 'assets/minesweeper/digit8.png';
import digit9 from 'assets/minesweeper/digit9.png';
import digit_ from 'assets/minesweeper/digit-.png';

const digits = [
  digit0,
  digit1,
  digit2,
  digit3,
  digit4,
  digit5,
  digit6,
  digit7,
  digit8,
  digit9,
];
function renderDigits(number) {
  let numberStr;
  if (number < 0) {
    const _number = -number % 100;
    if (_number === 0) {
      numberStr = '00';
    } else if (_number < 10) {
      numberStr = '0' + _number;
    } else {
      numberStr = String(_number);
    }
    return (
      <>
        <img src={digit_} alt="-" />
        {numberStr.split('').map((n, i) => (
          <img src={digits[n]} key={i} alt={n} />
        ))}
      </>
    );
  }

  numberStr = number < 999 ? String(number) : '999';
  if (number < 10) numberStr = '00' + numberStr;
  else if (number < 100) numberStr = '0' + numberStr;
  return numberStr
    .split('')
    .map((n, i) => <img key={i} src={digits[n]} alt={n} />);
}

function genDropDownData(difficulty) {
  let _Game = [...dropDownData.Game];
  _Game[2].symbol = difficulty === 'Beginner' && 'check';
  _Game[3].symbol = difficulty === 'Intermediate' && 'check';
  _Game[4].symbol = difficulty === 'Expert' && 'check';
  return { Game: _Game, Help: dropDownData.Help };
}

function MineSweeperView({
  ceils,
  className,
  changeCeilState,
  onReset,
  openCeil,
  openCeils,
  mines,
  status,
  seconds,
  onClose,
  difficulty,
  openingCeil,
  openingCeils,
  columns,
  rows,
  mobile,
}) {
  const face = useRef(null);
  const skipClick = useRef(-1);
  const inputType = useRef('mouse');
  const touch = useRef(null);
  const [flagMode, setFlagMode] = useState(false);
  const [mouseDownContent, setMouseDownContent] = useState(false);
  const [openBehavior, setOpenBehavior] = useState({ index: -1, behavior: '' });
  useEffect(() => {
    if (!mobile) setFlagMode(false);
  }, [mobile]);
  function indexFromEvent(e) {
    const cell = e.target.closest('.mine__ceil');
    return cell ? Number(cell.dataset.index) : -1;
  }
  function activateCell(index) {
    if (flagMode) changeCeilState(index);
    else if (ceils[index].state === 'open') openCeils(index);
    else openCeil(index);
  }
  function onClickCeils(e) {
    const index = indexFromEvent(e);
    if (index === -1) return;
    if (skipClick.current === index) {
      skipClick.current = -1;
      return;
    }
    activateCell(index);
  }
  function cancelTouch() {
    touch.current = null;
    setOpenBehavior({ index: -1, behavior: '' });
    setMouseDownContent(false);
  }
  function onPointerDownCeils(event) {
    inputType.current = event.pointerType || 'mouse';
    skipClick.current = -1;
    if (inputType.current === 'mouse') return;
    if (event.isPrimary === false) return cancelTouch();
    const index = indexFromEvent(event);
    if (index < 0) return;
    touch.current = {
      id: event.pointerId,
      index,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    setMouseDownContent(true);
    if (!flagMode) setOpenBehavior({ index, behavior: 'single' });
  }
  function onPointerMoveCeils(event) {
    const press = touch.current;
    if (!press || press.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) {
      press.moved = true;
      setOpenBehavior({ index: -1, behavior: '' });
      setMouseDownContent(false);
    }
  }
  function onPointerUpCeils(event) {
    const press = touch.current;
    if (!press || press.id !== event.pointerId) return;
    if (!press.moved) {
      activateCell(press.index);
      skipClick.current = press.index;
    }
    cancelTouch();
  }
  function remainMines() {
    return (
      mines -
      ceils.filter(ceil => ceil.state === 'flag' || ceil.state === 'misflagged')
        .length
    );
  }
  function statusFace() {
    if (mouseDownContent) return <img alt="ohh" src={ohh} />;
    switch (status) {
      case 'died':
        return <img alt="dead" src={dead} />;
      case 'won':
        return <img alt="win" src={win} />;
      default:
        return <img alt="smile" src={smile} />;
    }
  }
  function onMouseDownContent(e) {
    if (e.button !== 0) return;
    if (
      face.current.contains(e.target) ||
      status === 'won' ||
      status === 'died'
    )
      return;
    setMouseDownContent(true);
  }
  useEffect(() => {
    const { index, behavior } = openBehavior;
    switch (behavior) {
      case 'single':
        return openingCeil(index);
      case 'multi':
        return openingCeils(index);
      default:
        openingCeil(-1);
    }
    // eslint-disable-next-line
  }, [openBehavior.index, openBehavior.behavior]);
  function onMouseDownCeils(e) {
    if (inputType.current !== 'mouse') return;
    skipClick.current = -1;
    const index = indexFromEvent(e);
    if (e.button === 2 && e.buttons === 2 && index !== -1) {
      changeCeilState(index);
    } else if (e.button === 0 && e.buttons === 1) {
      setOpenBehavior({
        index,
        behavior: 'single',
      });
    } else if (e.buttons === 3) {
      setOpenBehavior({
        index,
        behavior: 'multi',
      });
    }
  }
  function onMouseOverCeils(e) {
    if (inputType.current !== 'mouse') return;
    const index = indexFromEvent(e);
    setOpenBehavior({
      index,
      behavior: openBehavior.behavior,
    });
  }
  function onMouseUpCeils() {
    if (inputType.current !== 'mouse') return;
    const { behavior, index } = openBehavior;
    if (index === -1) return;
    if (behavior === 'single') {
      activateCell(index);
      skipClick.current = index;
    } else if (behavior === 'multi') {
      openCeils(index);
      skipClick.current = index;
    }
  }
  function onClickOptionItem(item) {
    switch (item) {
      case 'Exit':
        onClose();
        break;
      case 'Beginner':
      case 'Intermediate':
      case 'Expert':
        onReset(item);
        break;
      case 'New':
        onReset();
        break;
      default:
    }
  }
  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  function onMouseUp(e) {
    setOpenBehavior({ index: -1, behavior: '' });
    setMouseDownContent(false);
  }
  return (
    <div
      className={className}
      onContextMenu={e => e.preventDefault()}
      data-difficulty={difficulty}
    >
      <div className="mine__options">
        <WindowDropDowns
          items={genDropDownData(difficulty)}
          onClickItem={onClickOptionItem}
        />
      </div>
      <section className="mine__content" onMouseDown={onMouseDownContent}>
        <div className="mine__score-bar">
          <div className="mine__digits__outer">
            {renderDigits(remainMines())}
          </div>
          <div className="mine__face__outer">
            <button ref={face} className="mine__face" onClick={() => onReset()}>
              {statusFace()}
              <img alt="smile" src={smile} />
            </button>
          </div>
          <div className="mine__digits__outer">{renderDigits(seconds)}</div>
        </div>
        {mobile && (
          <div
            className="mine__touch-controls"
            role="group"
            aria-label="Touch controls"
          >
            <button
              type="button"
              aria-pressed={!flagMode}
              onClick={() => setFlagMode(false)}
            >
              Reveal
            </button>
            <button
              type="button"
              aria-pressed={flagMode}
              onClick={() => setFlagMode(true)}
            >
              Flag
            </button>
            <span>
              {flagMode
                ? 'Tap a square to mark it'
                : 'Tap a square to reveal it'}
            </span>
          </div>
        )}
        <div className="mine__board-scroll">
          <div
            className="mine__content__inner"
            role="group"
            aria-label={`${difficulty} Minesweeper board`}
            data-columns={columns}
            data-rows={rows}
            onPointerDown={onPointerDownCeils}
            onPointerMove={onPointerMoveCeils}
            onPointerUp={onPointerUpCeils}
            onPointerCancel={cancelTouch}
            onMouseDown={onMouseDownCeils}
            onMouseOver={onMouseOverCeils}
            onMouseUp={onMouseUpCeils}
            onClick={onClickCeils}
          >
            <Ceils ceils={ceils} columns={columns} />
          </div>
        </div>
      </section>
    </div>
  );
}
function getTextImg(index) {
  return [empty, open1, open2, open3, open4, open5, open6, open7, open8][index];
}
function Ceils({ ceils, columns }) {
  function renderContent(ceil) {
    const { state, minesAround, opening } = ceil;
    switch (state) {
      case 'open':
        return <MinesAround mines={minesAround} />;
      case 'flag':
        return <Flag />;
      case 'misflagged':
        return <MisFlagged />;
      case 'mine':
        return <Mine />;
      case 'die':
        return <Die />;
      case 'unknown':
        return opening ? <QuestionOpen /> : <Question />;
      default:
        return opening ? <CeilBackgroundOpen /> : <CeilBackgroundCover />;
    }
  }

  return ceils.map((ceil, index) => (
    <button
      key={index}
      type="button"
      className="mine__ceil"
      data-index={index}
      data-state={ceil.state}
      aria-label={`Row ${Math.floor(index / columns) + 1}, column ${(index %
        columns) +
        1}: ${
        ceil.state === 'open'
          ? `${Math.max(0, ceil.minesAround)} nearby mines`
          : ceil.state === 'cover'
          ? 'covered'
          : ceil.state
      }`}
    >
      {renderContent(ceil)}
    </button>
  ));
}

const Die = () => (
  <>
    <CeilBackgroundOpen />
    <img alt="death" src={mineDeath} />
  </>
);
const MisFlagged = () => (
  <>
    <CeilBackgroundOpen />
    <img alt="misFlagged" src={misFlagged} />
  </>
);
const Flag = () => (
  <>
    <CeilBackgroundCover />
    <img alt="flag" src={flag} />
  </>
);
const MinesAround = ({ mines }) => (
  <>
    <CeilBackgroundOpen />
    <img alt="mines-around" src={getTextImg(mines)} />
  </>
);
const Question = () => (
  <>
    <CeilBackgroundCover />
    <img alt="question" src={question} />
  </>
);
const QuestionOpen = () => (
  <>
    <CeilBackgroundOpen />
    <img alt="question" src={question} />
  </>
);
const Mine = () => (
  <>
    <CeilBackgroundOpen />
    <img alt="mine" src={mine} />
  </>
);

const CeilBackgroundCover = styled.div`
  position: absolute;
  inset: 0;
  border-left: rgb(245, 245, 245) solid 2px;
  border-top: rgb(245, 245, 245) solid 2px;
  border-right: rgb(128, 128, 128) solid 2px;
  border-bottom: rgb(128, 128, 128) solid 2px;
`;
const CeilBackgroundOpen = styled.div`
  position: absolute;
  inset: 0;
  border-left: rgb(128, 128, 128) solid 1px;
  border-top: rgb(128, 128, 128) solid 1px;
`;

export default styled(MineSweeperView)`
  --mine-cell-size: 16px;
  width: max-content;
  max-width: 100%;
  img {
    pointer-events: none;
  }
  .mine__options {
    height: 20px;
    background: rgb(236, 233, 216);
  }
  .mine__content {
    border-left: rgb(245, 245, 245) solid 3px;
    border-top: rgb(245, 245, 245) solid 3px;
    background-color: rgb(192, 192, 192);
    padding: 5px;
  }
  .mine__board-scroll {
    max-height: calc(
      var(--desktop-viewport-height, 100vh) - var(--desktop-safe-top) -
        var(--desktop-taskbar-height) - 160px
    );
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    touch-action: pan-y pinch-zoom;
  }
  .mine__touch-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 38px;
    font: 10px Tahoma, sans-serif;
  }
  .mine__touch-controls button {
    min-height: 30px;
    padding: 3px 7px;
    color: #111;
    border: 1px solid #777;
    background: linear-gradient(#fff, #ece9d8);
    font: 11px Tahoma, sans-serif;
  }
  .mine__touch-controls button[aria-pressed='true'] {
    background: #ddd;
    box-shadow: inset 1px 1px 2px #777;
  }
  .mine__touch-controls span {
    flex: 1;
    max-width: 115px;
  }
  .mine__score-bar {
    height: 34px;
    border-radius: 1px;
    border-top: rgb(128, 128, 128) solid 2px;
    border-left: rgb(128, 128, 128) solid 2px;
    border-right: rgb(245, 245, 245) solid 2px;
    border-bottom: rgb(245, 245, 245) solid 2px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 7px 3px 4px;
  }
  .mine__digits__outer {
    width: 40px;
    height: 24px;
    border-width: 0 1px 1px 0;
    border-style: solid;
    border-color: #fff;
    text-align: right;
  }
  .mine__face__outer {
    width: 24px;
    height: 24px;
    border-top: 1px solid rgb(128, 128, 128);
    border-left: 1px solid rgb(128, 128, 128);
    border-radius: 2px;
    transform: translateX(1px);
  }
  .mine__face {
    border-radius: 2px;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(192, 192, 192);
    border-width: 2px;
    border-style: solid;
    border-color: rgb(245, 245, 245) rgb(128, 128, 128) rgb(128, 128, 128)
      rgb(245, 245, 245);
    outline: none;
    &:active:hover {
      border-width: 1px;
      border-color: rgb(128, 128, 128);
      img {
        transform: translate(1px, 1px);
      }
      img:nth-child(1) {
        display: none;
      }
      img:nth-child(2) {
        display: block;
      }
    }
    img:nth-child(2) {
      display: none;
    }
  }
  .mine__content__inner {
    display: grid;
    grid-template-columns: repeat(
      ${({ columns }) => columns},
      var(--mine-cell-size)
    );
    grid-template-rows: repeat(${({ rows }) => rows}, var(--mine-cell-size));
    border-top: rgb(128, 128, 128) solid 3px;
    border-left: rgb(128, 128, 128) solid 3px;
    border-right: rgb(245, 245, 245) solid 3px;
    border-bottom: rgb(245, 245, 245) solid 3px;
  }
  .mine__ceil {
    display: block;
    width: var(--mine-cell-size);
    height: var(--mine-cell-size);
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    position: relative;
    -webkit-touch-callout: none;
    &:focus-visible {
      outline: 1px dotted #111;
      outline-offset: -3px;
      z-index: 1;
    }
    * {
      pointer-events: none;
    }
    img {
      position: absolute;
      inset: 0;
      width: var(--mine-cell-size);
      height: var(--mine-cell-size);
      image-rendering: pixelated;
    }
  }
  ${({ mobile, columns }) =>
    mobile &&
    `
    --mine-cell-size: min(24px, calc((100vw - var(--desktop-safe-left) - var(--desktop-safe-right) - 56px) / ${columns}));
  `}
`;
