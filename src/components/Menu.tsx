import { Box, Container, CssBaseline, Typography } from '@mui/material'
import React from 'react'
import Feed from './Feed'
import { Header, Root, SidePane } from './Layout'

type MenuProps = {}

const Menu = (props: MenuProps) => {
  return (
    <React.Fragment>
      <CssBaseline />
      <Container sx={{
        bgcolor: 'gainsboro'
      }} >
        <Typography>
          Main app content here
        </Typography>
        <Feed/>
      </Container>
    </React.Fragment>
  )
}

export default Menu