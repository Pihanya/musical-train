import React from 'react';
import '@vkontakte/vkui/dist/vkui.css';
import {
    IOS,
    Panel,
    PanelHeader,
    PanelHeaderButton,
    platform,
    RichCell,
    Avatar,
    Separator,
    Div,
    Group, Link, Title, Button
} from "@vkontakte/vkui";
import Icon28ChevronBack from "@vkontakte/icons/dist/28/chevron_back";
import Icon24Back from "@vkontakte/icons/dist/24/back";
import {getStore, setStore} from "../store";

const osName = platform();

export default class ViewPodcast extends React.Component {
    getDuration() {
        const duration = this.state.duration;
        const h = Math.floor(duration / 3600);
        const m = Math.floor((duration - h * 3600) / 60);
        const s = Math.floor(duration - h * 3600 - m * 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        } else {
            return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
    };

    shortDuration(t) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t - m * 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    constructor(data) {
        super(data);
        this.state = {
            id: data.id,
            go: data.go,

            name: null,
            description: null,

            image: null,
            timecodes: [],
            duration: 0
        }

        this.getDuration = this.getDuration.bind(this)
        this.shortDuration = this.shortDuration.bind(this)
    }

    componentDidMount() {
        this.loadFromStore(true)
    }

    loadFromStore(performUpdate) {
        const s = getStore()
        const change = {
            name: s.name,
            description: s.description,
            duration: s.duration,
            image: s.imageFileUrl,
            timecodes: s.timecodes
        }

        if(performUpdate) {
            this.setState(change)
        } else {
            this.state = {...this.state, ...change}
        }
    }

    render() {
        return (<Panel id={this.state.id}>
            <PanelHeader
                left={<PanelHeaderButton onClick={this.state.go} data-to="back">
                    {osName === IOS ? <Icon28ChevronBack/> : <Icon24Back/>}
                </PanelHeaderButton>}
            >
                Новый подкаст
            </PanelHeader>
            <RichCell
                before={<Avatar mode="app" size={48} src={this.state.image} />}
                text="ПараDogs"
                caption={`Длительность: ${this.getDuration()}`}
            >
                {this.state.name}
            </RichCell>
            <Separator/>
            <Div>
                <Group header={<Title style={{marginTop: 0}} level="3" weight="semibold">Описание</Title>}>
                    {this.state.description}
                </Group>
            </Div>
            <Separator/>
            <Div>
                <Group header={<Title style={{marginTop: 0, marginBottom: 8}} level="3" weight="semibold">Содержание</Title>}>
                    {this.state.timecodes.map((tc) => <div style={{marginBottom: 8}}>
                        <Link>{this.shortDuration(tc.time)}</Link> — {tc.text}
                    </div>)}
                </Group>
            </Div>
            <Div>
                <Button
                    size="xl"
                    onClick={this.state.go} data-to="share"
                    className="bottom-btn"
                >
                    Опубликовать
                </Button>
            </Div>
        </Panel>
    );
    }
}
