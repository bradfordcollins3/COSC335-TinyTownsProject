import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from '../src/app.jsx';


describe("App DOM", () => {

  beforeEach(() => {
    render(<App />);
  });


  test("renders a 3x3 board", () => {
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(10);
  });

  test("clicking a square updates the board", () => {
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(buttons[0].textContent).toBe("X");
  });

  test("reset button clears the board", () => {
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[9]); // Reset
    expect(buttons[0].textContent).toBe("");
  });

  
});
