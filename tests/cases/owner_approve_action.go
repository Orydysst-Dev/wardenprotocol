package cases

import (
	"context"
	"fmt"
	"github.com/stretchr/testify/require"
	types "github.com/warden-protocol/wardenprotocol/warden/x/warden/types/v1beta2"
	"testing"

	"github.com/warden-protocol/wardenprotocol/tests/framework"
	"github.com/warden-protocol/wardenprotocol/tests/framework/checks"
	"github.com/warden-protocol/wardenprotocol/tests/framework/exec"
)

func init() {
	Register(&Test_OwnerApproveAction{})
}

type Test_OwnerApproveAction struct {
	w *exec.WardenNode
}

func (c *Test_OwnerApproveAction) Setup(t *testing.T, ctx context.Context, build framework.BuildResult) {
	c.w = exec.NewWardenNode(t, build.Wardend)

	go c.w.Start(t, ctx, "./testdata/snapshot-many-users")
	c.w.WaitRunnning(t)
}

func (c *Test_OwnerApproveAction) Run(t *testing.T, ctx context.Context, _ framework.BuildResult) {
	client := TestGRPCClient(*c.w.GRPCClient(t))

	users := TestUsers{
		Alice:   User{Name: "alice", Key: "warden19u97f0928q306grmkpa7w5hpxcmtf625uzaqg9"},
		Bob:     User{Name: "bob", Key: "warden1emghyenumveuu3jc5zgu7ny2zkcj2c5qm3l2g2"},
		Charlie: User{Name: "charlie", Key: "warden14xaez22aa8wlk7zdrpv7ea0j9h2g2da9tutenp"},
		Dave:    User{Name: "dave", Key: "warden1mx09erayrjxlwaj2tvfq9rqw7hxyypkzsc36vg"},
	}

	bob := users.Bob.client(c.w)
	alice := users.Alice.client(c.w)
	charlie := users.Charlie.client(c.w)

	addNewOwnerCommandTemplate := "warden new-action add-space-owner --space-id %d --new-owner %s"

	resAddOwner := bob.Tx(t, fmt.Sprintf(addNewOwnerCommandTemplate, 1, users.Bob.Key))
	checks.SuccessTx(t, resAddOwner)
	client.EnsureSpaceAmount(t, ctx, users.Bob.Key, 0)

	resApproveBob := alice.Tx(t, "act approve-action --action-id 1")
	checks.SuccessTx(t, resApproveBob)
	client.EnsureSpaceAmount(t, ctx, users.Bob.Key, 1)

	resNewRule := alice.Tx(t, "act new-rule --name approve_requires_two --definition \"any(2, warden.space.owners)\"")
	checks.SuccessTx(t, resNewRule)

	resAssigneRule := alice.Tx(t, "warden new-action update-space --space-id 1 --admin-rule-id 1")
	checks.SuccessTx(t, resAssigneRule)

	resAliceAddOwnerCharlie := alice.Tx(t, fmt.Sprintf(addNewOwnerCommandTemplate, 1, users.Charlie.Key))
	checks.SuccessTx(t, resAliceAddOwnerCharlie)
	client.EnsureSpaceAmount(t, ctx, users.Charlie.Key, 0)

	resApproveCharlie := bob.Tx(t, "act approve-action --action-id 3")
	checks.SuccessTx(t, resApproveCharlie)
	client.EnsureSpaceAmount(t, ctx, users.Charlie.Key, 1)

	resCharlieAddOwnerDave := charlie.Tx(t, fmt.Sprintf(addNewOwnerCommandTemplate, 1, users.Dave.Key))
	checks.SuccessTx(t, resCharlieAddOwnerDave)
	client.EnsureSpaceAmount(t, ctx, users.Dave.Key, 0)

	resApproveDaveByBob := bob.Tx(t, "act approve-action --action-id 4")
	checks.SuccessTx(t, resApproveDaveByBob)
	client.EnsureSpaceAmount(t, ctx, users.Dave.Key, 1)
}

type TestGRPCClient exec.GRPCClient

func (client *TestGRPCClient) EnsureSpaceAmount(t *testing.T, ctx context.Context, ownerKey string, amount int) {
	resSpacesByDaveAfterBobApprove, err := client.Warden.SpacesByOwner(ctx, &types.QuerySpacesByOwnerRequest{
		Owner: ownerKey,
	})
	require.NoError(t, err)
	require.Equal(t, amount, len(resSpacesByDaveAfterBobApprove.Spaces))
}

type TestUsers struct {
	Alice   User
	Bob     User
	Charlie User
	Dave    User
}

type User struct {
	Name string
	Key  string
}

func (u *User) client(node *exec.WardenNode) *exec.Wardend {
	return exec.NewWardend(node, u.Name)
}
