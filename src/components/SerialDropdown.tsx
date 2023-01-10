import React from 'react'

import { ClickAwayListener, createTheme, Grow, MenuItem, ThemeProvider } from '@mui/material'
import ButtonGroup from '@mui/material/ButtonGroup'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import Paper from '@mui/material/Paper'
import MenuList from '@mui/material/MenuList'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { Redraws } from './Feed'

export interface ConnectDispatcher {
    select(name: string): void
    connect(name: string): void
}

// control pane displays a dropdown menu
// with accessible serial connections
type SerialPaneProps = {
    serials: string[]
    dispatcher: ConnectDispatcher
}

const lowercaseButtonTheme = createTheme({
    typography: {
        button: {
            textTransform: "none"
        }
    }
})

// Dropdown menu with serial connections
const SerialSelectorDropdown = React.memo(({ serials, dispatcher }: SerialPaneProps) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [open, setOpen] = React.useState(false)
    const anchorRef = React.useRef<HTMLDivElement>(null);

    const handleClick = () => {
        dispatcher.connect(serials[selectedIndex])
    };

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        // does this callback trigger two re-renders?
        setSelectedIndex(index);
        setOpen(false);
        dispatcher.select(serials[index])
    };

    const handleClose = (event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }
        setOpen(false);
    };

    const disabled = serials.length === 0

    return (
        <ThemeProvider theme={lowercaseButtonTheme}>
            <Redraws name='control pane' />
            <ButtonGroup variant="contained" ref={anchorRef} aria-label="serial button" disableElevation>
                <Button onClick={handleClick} disabled={disabled}>{serials[selectedIndex]}</Button>
                <Button
                    disabled={disabled}
                    aria-controls={open ? 'serial-selector-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select connection to open"
                    aria-haspopup="menu"
                    onClick={() => setOpen((prevOpen) => !prevOpen)}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={open}
                anchorEl={anchorRef.current}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="serial-selector-menu" autoFocusItem>
                                    {serials.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </ThemeProvider>
    )
})

export default SerialSelectorDropdown