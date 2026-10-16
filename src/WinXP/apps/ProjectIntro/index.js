import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { hopscotchProject, framesProject } from '../../projects';

function ProjectIntro({ project, onClose, isFocus }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (isFocus && dialog.current) dialog.current.focus();
  }, [isFocus]);
  const actions = project.actions || [
    { label: 'View project' },
    { label: 'Read more' },
  ];
  return (
    <Div
      ref={dialog}
      role="dialog"
      aria-label={`About ${project.name}`}
      tabIndex={-1}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="intro__page">
        <aside className="intro__art" aria-hidden="true">
          {project.panelImage ? (
            <img
              className="intro__panel-image"
              src={project.panelImage}
              alt=""
            />
          ) : (
            <>
              <svg className="intro__drawing" viewBox="0 0 164 300" fill="none">
                <path
                  d="M-26 62 136 119 136 213-26 155Z"
                  stroke="#143b9e"
                  strokeWidth="7"
                />
                <path
                  d="M-34 131 109 183 109 272-34 220Z"
                  stroke="#0d266e"
                  strokeWidth="9"
                />
                <path
                  d="M19 178 186 237 186 329 19 270Z"
                  stroke="#1c42a3"
                  strokeWidth="7"
                />
                <path
                  d="M62 107 112 124 112 157 62 140Z"
                  stroke="#1e47b8"
                  strokeWidth="5"
                />
                <path
                  d="m105 211 35 13v21l-35-12Z"
                  stroke="#1f439d"
                  strokeWidth="5"
                />
              </svg>
              <div className="intro__icon-frame">
                <img
                  className="intro__icon"
                  src={project.icon}
                  alt=""
                  style={{ imageRendering: project.imageRendering }}
                />
              </div>
            </>
          )}
        </aside>
        <main className="intro__content">
          <h1 className="intro__heading">
            Welcome to
            <br />
            {project.name}
          </h1>
          {project.description && (
            <p className="intro__description">{project.description}</p>
          )}
        </main>
      </div>
      <footer className="intro__footer">
        {actions.slice(0, 2).map((action, index) =>
          action.href ? (
            <a
              key={action.label}
              className={`intro__button${
                index === 0 ? ' intro__button--primary' : ''
              }`}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {action.label}
            </a>
          ) : (
            <button
              key={action.label}
              className="intro__button"
              type="button"
              disabled
            >
              {action.label}
            </button>
          ),
        )}
      </footer>
    </Div>
  );
}

export function HopscotchIntro(props) {
  return <ProjectIntro {...props} project={hopscotchProject} />;
}

export function FramesIntro(props) {
  return <ProjectIntro {...props} project={framesProject} />;
}

const Div = styled.section`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ece9d8;
  color: #111;
  font-family: Tahoma, Verdana, sans-serif;
  font-size: 11px;
  outline: none;
  .intro__page {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .intro__art {
    position: relative;
    width: 164px;
    flex-shrink: 0;
    overflow: hidden;
    background: linear-gradient(150deg, #06164b, #061d62 62%, #051749);
  }
  .intro__drawing {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
  }
  .intro__panel-image {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    object-fit: cover;
    object-position: center;
  }
  .intro__icon-frame {
    position: absolute;
    top: 24px;
    right: 21px;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #fff;
    background: #081e62;
    box-shadow: 1px 1px #020b2b;
  }
  .intro__icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
  .intro__content {
    flex: 1;
    min-width: 0;
    overflow: auto;
    padding: 25px 27px;
    background: #f8f6ed;
  }
  .intro__heading {
    margin: 0 0 22px;
    color: #111;
    font-size: 21px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.35px;
  }
  .intro__description {
    margin: 0;
    line-height: 1.65;
    white-space: pre-line;
  }
  .intro__footer {
    height: 53px;
    flex-shrink: 0;
    padding: 13px 12px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid #aca899;
    box-shadow: inset 0 1px #fff;
    background: #ece9d8;
  }
  .intro__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
    height: 25px;
    padding: 3px 14px;
    border: 1px solid #003c74;
    border-radius: 3px;
    background: linear-gradient(#fff, #ece9d8);
    box-shadow: inset 1px 1px #fff, inset -1px -1px #d4d0c8;
    color: #111;
    font: inherit;
    line-height: 17px;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
  }
  .intro__button--primary {
    box-shadow: inset 0 0 0 2px #b9d0ea, inset 0 0 0 3px #fff;
  }
  .intro__button:hover {
    box-shadow: inset 0 0 0 2px #f4cf73;
  }
  .intro__button:active {
    background: #e3e0d3;
    box-shadow: inset 1px 1px 2px #bbb;
  }
  .intro__button:focus-visible {
    outline: 1px dotted #111;
    outline-offset: -5px;
  }
  .intro__button:disabled {
    border-color: #aaa;
    color: #888;
    text-shadow: 1px 1px #fff;
    cursor: default;
    box-shadow: inset 1px 1px #fff;
  }
  @media (max-width: 520px) {
    .intro__art {
      width: 105px;
    }
    .intro__icon-frame {
      right: 16px;
      width: 58px;
      height: 58px;
    }
    .intro__content {
      padding: 24px 18px;
    }
    .intro__heading {
      font-size: 20px;
    }
    .intro__button {
      min-width: 90px;
      padding: 3px 10px;
    }
  }
`;
