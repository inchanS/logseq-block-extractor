import {getAllProperties} from "../data/query";

export async function validateAndSetDefaultSortField(sortField: string) {
    if (!sortField || sortField.trim() === '') {
        console.log('Sort field is empty, using default: filename');
        return 'filename';
    }

    const trimmedSortField = sortField.trim();

    if (trimmedSortField === 'filename') {
        return 'filename';
    }

    const commonSystemFields = [
        'date', 'created-at', 'updated-at', 'tags', 'alias',
        'created_at', 'updated_at', 'journal-day', 'journal_day'
    ];

    if (commonSystemFields.includes(trimmedSortField)) {
        console.log(`Using system field: ${trimmedSortField}`);
        return trimmedSortField;
    }

    try {
        const allProperties: any[] = await getAllProperties();

        const normalizedField = trimmedSortField.toLowerCase();
        const validProperty = allProperties.find(prop =>
            prop.toLowerCase() === normalizedField
        );

        if (validProperty) {
            console.log(`Valid property found: ${validProperty}`);
            return validProperty;
        }

        const colonField = `:${trimmedSortField}`;
        const validColonProperty = allProperties.find(prop =>
            prop.toLowerCase() === colonField.toLowerCase()
        );

        if (validColonProperty) {
            console.log(`Valid colon property found: ${validColonProperty}`);
            return validColonProperty.replace(/^:+/, '');
        }

        console.warn(`Invalid sort field: ${trimmedSortField}, falling back to filename`);
        logseq.UI.showMsg(`Invalid sort field "${trimmedSortField}", using filename instead`, 'warning');
        return 'filename';

    } catch (error) {
        console.error('Error validating sort field:', error);
        console.log('Error occurred during validation, using default: filename');
        return 'filename';
    }
}