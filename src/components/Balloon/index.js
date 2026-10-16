import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import computer from 'assets/windowsIcons/676(16x16).png';

function Balloon({ startAfter = 600, onClose }) {
  const [start, setStart] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    const openTimer = setTimeout(() => setStart(true), startAfter);
    return () => clearTimeout(openTimer);
  }, [startAfter]);
  async function onSubmit(e) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, website, consent: true }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(
          result.message || 'Your request could not be sent. Please try again.',
        );
      }
      setStatus('sent');
    } catch (err) {
      setError(err.message || 'Please check your connection and try again.');
      setStatus('error');
    }
  }
  return (
    start && (
      <Div role="region" aria-label="Welcome to jackpelech.com">
        <div className="balloon__container">
          <button
            type="button"
            onClick={onClose}
            className="balloon__close"
            aria-label="Close welcome message"
          />
          <div className="balloon__header">
            <img className="balloon__header__img" src={computer} alt="" />
            <span className="balloon__header__text">
              Welcome to jackpelech.com
            </span>
          </div>
          <p className="balloon__text__first">
            Hi, I’m Jack. Explore my projects, play a round of Minesweeper, and
            make yourself at home.
          </p>
          {!formOpen && (
            <button
              type="button"
              className="balloon__signup-link"
              onClick={() => setFormOpen(true)}
            >
              Join the newsletter waitlist
            </button>
          )}
          {formOpen &&
            (status === 'sent' ? (
              <p className="balloon__success" role="status">
                Thanks! Your waitlist request has been sent. Stay tuned.
              </p>
            ) : (
              <form className="balloon__form" onSubmit={onSubmit}>
                <p className="balloon__form-intro">
                  Leave your email for project updates and the newsletter
                  launch.
                </p>
                <label htmlFor="waitlist-name">Name (optional)</label>
                <input
                  id="waitlist-name"
                  name="name"
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={status === 'sending'}
                />
                <label htmlFor="waitlist-email">Email address</label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                />
                <input
                  className="balloon__honeypot"
                  name="website"
                  aria-hidden="true"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
                <p className="balloon__consent">
                  By joining, you’re asking to receive occasional updates from
                  Jack.
                </p>
                {error && (
                  <p className="balloon__error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="balloon__submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending…' : 'Join waitlist'}
                </button>
              </form>
            ))}
        </div>
      </Div>
    )
  );
}
const fadein = keyframes`
  0% { 
    display: block;
    opacity: 0;
  }
  100% {
    display: block;
    opacity: 1;
  }
`;
const Div = styled.div`
  position: absolute;
  display: block;
  opacity: 0;
  z-index: 1;
  animation: ${fadein} 0.3s forwards;
  filter: drop-shadow(2px 2px 1px rgba(0, 0, 0, 0.4));
  .balloon__container {
    position: absolute;
    right: -4px;
    bottom: 19px;
    border: 1px solid black;
    border-radius: 7px;
    padding: 10px 26px 12px 12px;
    background-color: #ffffe1;
    font-size: 11px;
    width: 328px;
    max-width: calc(100vw - 90px);
    white-space: normal;
    line-height: 1.45;
    &:before {
      content: '';
      position: absolute;
      display: block;
      bottom: -19px;
      right: 14px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 19px 19px 0;
      border-color: transparent black transparent transparent;
    }
    &:after {
      content: '';
      position: absolute;
      display: block;
      bottom: -17px;
      right: 15px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 18px 18px 0;
      border-color: transparent #ffffe1 transparent transparent;
    }
  }
  .balloon__close:hover {
    background-color: #ffa90c;
    border-color: white;
    box-shadow: 1px 1px rgba(0, 0, 0, 0.1);
    &:before,
    &:after {
      background-color: white;
    }
  }
  .balloon__close {
    outline: none;
    position: absolute;
    right: 4px;
    top: 4px;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    background-color: transparent;
    &:before {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      transform: rotate(45deg);
      height: 8px;
      width: 2px;
      background-color: rgba(170, 170, 170);
    }
    &:after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      transform: rotate(-45deg);
      height: 8px;
      width: 2px;
      background-color: rgba(170, 170, 170);
    }
  }
  .balloon__header {
    display: flex;
    align-items: center;
    font-weight: 700;
  }
  .balloon__header__img {
    width: 14px;
    height: 14px;
    margin-right: 8px;
  }
  .balloon__text__first {
    margin: 8px 0 10px;
  }
  .balloon__signup-link {
    border: 0;
    padding: 0;
    background: transparent;
    color: #003399;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
    text-align: left;
  }
  .balloon__signup-link:hover {
    color: #0066cc;
  }
  .balloon__form-intro {
    margin: 4px 0 10px;
  }
  .balloon__form label {
    display: block;
    margin-bottom: 3px;
  }
  .balloon__form input {
    width: 100%;
    height: 23px;
    padding: 3px 5px;
    margin-bottom: 8px;
    border: 1px solid #7f9db9;
    border-radius: 0;
    background: white;
    color: #111;
    font: inherit;
  }
  .balloon__form input:focus {
    outline: 1px solid #0054e3;
    outline-offset: 1px;
  }
  .balloon__form .balloon__honeypot {
    display: none;
  }
  .balloon__consent {
    color: #555;
    font-size: 10px;
    margin: 2px 0 10px;
  }
  .balloon__submit {
    min-width: 96px;
    padding: 4px 12px;
    border: 1px solid #003c74;
    border-radius: 3px;
    box-shadow: inset 1px 1px white, inset -1px -1px #d6d0c2;
    background: linear-gradient(#fff, #ece9d8);
    color: #111;
    font: inherit;
    cursor: pointer;
  }
  .balloon__submit:disabled {
    color: #777;
    cursor: wait;
  }
  .balloon__error {
    color: #a60000;
    margin: 4px 0 10px;
  }
  .balloon__success {
    color: #154e12;
    margin: 8px 0 0;
  }
`;
export default Balloon;
