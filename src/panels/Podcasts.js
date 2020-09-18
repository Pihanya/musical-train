import React from 'react';
import '@vkontakte/vkui/dist/vkui.css';
import {Button, Div, Panel, PanelHeader, Placeholder, Title} from "@vkontakte/vkui";
import Icon56AddCircleOutline from '@vkontakte/icons/dist/56/add_circle_outline';

const Podcasts = ({id, go}) => {
    return (
        <Panel id={id}>
            <PanelHeader>Подкасты</PanelHeader>
            <Placeholder stretched>
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: 10}}>
                    <Icon56AddCircleOutline/>
                </div>
                <Title level="2" weight="bold" style={{color: 'var(--landing_text_primary)', marginBottom: 10}}>
                    Добавьте первый подкаст
                </Title>
                Добавляйте, редактируйте и делитесь<br/>подкастами вашего соообщеста.
                <Div/>
                <Div>
                    <Button size="l" onClick={go} data-to='new-podcast'>Добавить подкаст</Button>
                </Div>
            </Placeholder>
        </Panel>
    );
}

export default Podcasts;
