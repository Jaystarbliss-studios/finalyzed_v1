-- Demo reserve for the active test administrator. Idempotent by reference so it is safe to replay.
insert into public.wallets(user_id,balance_ngn,points_balance)
values ('6afd5dd7-f9f4-4f17-bc17-74164d2c7966',5000000,500000)
on conflict (user_id) do update set balance_ngn=greatest(public.wallets.balance_ngn,5000000),points_balance=greatest(public.wallets.points_balance,500000),updated_at=now();

insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
select '6afd5dd7-f9f4-4f17-bc17-74164d2c7966','admin_demo_funding_cash',5000000,0,'DEMO-ADMIN-FUND-CASH-20260829',jsonb_build_object('demo',true,'purpose','tester funding reserve')
where not exists (select 1 from public.wallet_transactions where reference='DEMO-ADMIN-FUND-CASH-20260829');

insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
select '6afd5dd7-f9f4-4f17-bc17-74164d2c7966','admin_demo_funding_points',0,500000,'DEMO-ADMIN-FUND-POINTS-20260829',jsonb_build_object('demo',true,'purpose','tester points reserve')
where not exists (select 1 from public.wallet_transactions where reference='DEMO-ADMIN-FUND-POINTS-20260829');