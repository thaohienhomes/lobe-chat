import { PortalImpl } from '../type';
import Body from './Body';
import Header from './Header';
import { useEnable } from './useEnable';

export const Research: PortalImpl = {
    Body,
    Title: Header,
    useEnable,
};
