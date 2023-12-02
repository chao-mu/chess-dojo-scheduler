import { Button, Divider, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { OpenInNew } from '@mui/icons-material';

import { SubscriptionStatus, User } from '../../database/user';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { useNavigate } from 'react-router-dom';

interface SubscriptionManagerProps {
    user: User;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ user }) => {
    const request = useRequest();
    const api = useApi();
    const navigate = useNavigate();

    const onManageSubscription = () => {
        request.onStart();
        api.subscriptionManage()
            .then((resp) => {
                window.location.href = resp.data.url;
            })
            .catch((err) => {
                console.error('subscriptionManage: ', err);
                request.onFailure(err);
            });
    };

    const isFreeTier = user.subscriptionStatus !== SubscriptionStatus.Subscribed;
    const paymentInfo = user.paymentInfo;

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />

            <Stack width={1}>
                <Typography variant='h5'>Subscription/Billing</Typography>
                <Divider />
            </Stack>

            {isFreeTier ? (
                <>
                    <Typography>Subscription Status: Free Tier</Typography>
                    <Button variant='contained' onClick={() => navigate('/prices')}>
                        View Prices
                    </Button>
                </>
            ) : (
                <>
                    <Typography>Subscription Status: Subscribed</Typography>

                    {paymentInfo && paymentInfo.customerId ? (
                        <LoadingButton
                            loading={request.isLoading()}
                            onClick={onManageSubscription}
                            variant='contained'
                            endIcon={<OpenInNew />}
                        >
                            Manage Subscription
                        </LoadingButton>
                    ) : (
                        <Button
                            variant='contained'
                            href='https://www.chessdojo.club/account/my-subscriptions'
                            endIcon={<OpenInNew />}
                        >
                            Manage Subscription
                        </Button>
                    )}
                </>
            )}
        </Stack>
    );
};

export default SubscriptionManager;
