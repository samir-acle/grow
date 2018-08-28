import React, { Component, Fragment } from 'react';
import { Box, Text, FormField, TextArea, Button, TextInput } from 'grommet';

class Details extends Component {

    constructor(props) {
        super(props);
    }

    submitDetails = (event) => {
        event.preventDefault();

        const data = {
            title: event.target[0].value,
            what: event.target[1].value,
            where: event.target[2].value,
            when: event.target[3].value,
            why: event.target[4].value,
        }

        this.props.onSubmit(data);
    };

    render() {
        return (
            <Box>
                <Text pad="small" tag="h4">The details will be used to verify that the pledge was completed. The more details the better. Leave fields blank if not applicable</Text>
                <form onSubmit={this.submitDetails}>
                    <Box direction="column">
                        <FormField label="Title">
                            <TextInput />
                        </FormField>
                        <FormField label="What" help="Description of what habit, action, task you will accomplish">
                            <TextArea />
                        </FormField>
                        <FormField label="Where" help="Where will this take place? Ex. At my local gym">
                            <TextArea />
                        </FormField>
                        <FormField label="When" help="When will this take place? Ex. Once a week, Every Friday, etc.">
                            <TextArea />
                        </FormField>
                        <FormField label="Why" help="What is the goal of this pledge? What growth are you looking for?">
                            <TextArea />
                        </FormField>
                        <Button type="submit" label="Submit" primary={true} />
                    </Box>
                </form>
            </Box>
        )
    }
}

export default Details;
